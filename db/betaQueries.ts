import { v4 as uuid } from 'uuid';
import { getDatabase } from './schema';
import { dbEvents } from './events';
import { deleteClipFile, deleteProjectClipDir } from '../services/betaFiles';
import {
  nextVersion,
  pickCurrentAfterDelete,
  stripEmptyMoves,
  videoFilesToDelete,
} from '../utils/betaLogic';
import type { Beta, BetaMove, BetaVideo, Limb, VideoNote } from '../types/beta';

// Beta is local-only: no outbox rows. Mutations still emit dbEvents so live hooks re-render.

function inTransaction<T>(fn: () => T): T {
  const db = getDatabase();
  db.execSync('BEGIN');
  try {
    const result = fn();
    db.execSync('COMMIT');
    return result;
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function mapBeta(r: any): Beta {
  return {
    id: r.id,
    projectId: r.project_id,
    version: r.version,
    label: r.label ?? '',
    isCurrent: r.is_current === 1,
    keyTip: r.key_tip ?? null,
    cruxMoveId: r.crux_move_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMove(r: any): BetaMove {
  return { id: r.id, betaId: r.beta_id, order: r.ord, text: r.text ?? '', limb: (r.limb as Limb | null) ?? null };
}

function mapVideo(r: any): BetaVideo {
  return {
    id: r.id,
    projectId: r.project_id,
    attemptId: r.attempt_id ?? null,
    localUri: r.local_uri,
    durationSec: r.duration_sec,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at,
  };
}

function mapNote(r: any): VideoNote {
  return { id: r.id, videoId: r.video_id, timestampSec: r.timestamp_sec, text: r.text ?? '' };
}

// ─── Betas (versions) ─────────────────────────────────────────────────────────

export function getBetasForProject(projectId: string): Beta[] {
  return getDatabase()
    .getAllSync<any>(`SELECT * FROM betas WHERE project_id = ? ORDER BY version ASC`, [projectId])
    .map(mapBeta);
}

export function getBeta(betaId: string): Beta | null {
  const r = getDatabase().getFirstSync<any>(`SELECT * FROM betas WHERE id = ?`, [betaId]);
  return r ? mapBeta(r) : null;
}

export function getMovesForBeta(betaId: string): BetaMove[] {
  return getDatabase()
    .getAllSync<any>(`SELECT * FROM beta_moves WHERE beta_id = ? ORDER BY ord ASC`, [betaId])
    .map(mapMove);
}

export interface BetaDraft {
  label: string;
  keyTip: string | null;
  /** Ordered as displayed; `order` is re-derived on save. The editor assigns every move a stable id (uuid). */
  moves: { id: string; text: string; limb: Limb | null }[];
  /** Id of the crux move. Cleared on save if that move is blank or removed. */
  cruxMoveId: string | null;
}

/**
 * Replaces a version's moves. Returns a map of draft id -> stored id.
 * `fresh` mints new row ids (draft ids are client-local and may be copies of another version's ids);
 * otherwise draft ids are kept so ids stay stable across saves.
 */
function writeMoves(betaId: string, moves: BetaDraft['moves'], fresh: boolean): Map<string, string> {
  const db = getDatabase();
  db.runSync(`DELETE FROM beta_moves WHERE beta_id = ?`, [betaId]);
  const cleaned = stripEmptyMoves(moves.map((m, i) => ({ ...m, order: i })));
  const idMap = new Map<string, string>();
  cleaned.forEach((m, i) => {
    const id = fresh ? uuid() : m.id;
    idMap.set(m.id, id);
    db.runSync(`INSERT INTO beta_moves (id, beta_id, ord, text, limb) VALUES (?, ?, ?, ?, ?)`, [
      id,
      betaId,
      i,
      m.text.trim(),
      m.limb,
    ]);
  });
  return idMap;
}

/** Creates a new version for a project. The first version is current; later ones are not unless `makeCurrent`. */
export function createBeta(projectId: string, draft: BetaDraft, makeCurrent = false): string {
  const id = inTransaction(() => {
    const db = getDatabase();
    const existing = getBetasForProject(projectId);
    const now = Date.now();
    const betaId = uuid();
    const current = existing.length === 0 || makeCurrent;
    if (current) db.runSync(`UPDATE betas SET is_current = 0 WHERE project_id = ?`, [projectId]);
    db.runSync(
      `INSERT INTO betas (id, project_id, version, label, is_current, key_tip, crux_move_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [betaId, projectId, nextVersion(existing), draft.label.trim(), current ? 1 : 0, draft.keyTip?.trim() || null, now, now],
    );
    const idMap = writeMoves(betaId, draft.moves, true);
    const crux = (draft.cruxMoveId && idMap.get(draft.cruxMoveId)) || null;
    db.runSync(`UPDATE betas SET crux_move_id = ? WHERE id = ?`, [crux, betaId]);
    return betaId;
  });
  dbEvents.emit();
  return id;
}

/** Updates an existing version's content (key tip, label, moves, crux). */
export function updateBeta(betaId: string, draft: BetaDraft): void {
  inTransaction(() => {
    const db = getDatabase();
    const idMap = writeMoves(betaId, draft.moves, false);
    const crux = (draft.cruxMoveId && idMap.get(draft.cruxMoveId)) || null;
    db.runSync(`UPDATE betas SET label = ?, key_tip = ?, crux_move_id = ?, updated_at = ? WHERE id = ?`, [
      draft.label.trim(),
      draft.keyTip?.trim() || null,
      crux,
      Date.now(),
      betaId,
    ]);
  });
  dbEvents.emit();
}

/** Marks one version current and every other version of that project not current (atomic). */
export function setCurrentBeta(betaId: string): void {
  inTransaction(() => {
    const db = getDatabase();
    const beta = getBeta(betaId);
    if (!beta) return;
    // Clear first: the partial unique index forbids two current rows at once.
    db.runSync(`UPDATE betas SET is_current = 0 WHERE project_id = ?`, [beta.projectId]);
    db.runSync(`UPDATE betas SET is_current = 1, updated_at = ? WHERE id = ?`, [Date.now(), betaId]);
  });
  dbEvents.emit();
}

/** Deletes a version (moves cascade). If it was current, the newest remaining version becomes current. */
export function deleteBeta(betaId: string): void {
  inTransaction(() => {
    const db = getDatabase();
    const beta = getBeta(betaId);
    if (!beta) return;
    db.runSync(`DELETE FROM betas WHERE id = ?`, [betaId]);
    const fixed = pickCurrentAfterDelete(getBetasForProject(beta.projectId));
    const target = fixed.find((b) => b.isCurrent);
    if (target) db.runSync(`UPDATE betas SET is_current = 1 WHERE id = ?`, [target.id]);
  });
  dbEvents.emit();
}

// ─── Videos and notes ─────────────────────────────────────────────────────────

export function getVideosForProject(projectId: string): BetaVideo[] {
  return getDatabase()
    .getAllSync<any>(`SELECT * FROM beta_videos WHERE project_id = ? ORDER BY created_at DESC`, [projectId])
    .map(mapVideo);
}

export function getVideo(videoId: string): BetaVideo | null {
  const r = getDatabase().getFirstSync<any>(`SELECT * FROM beta_videos WHERE id = ?`, [videoId]);
  return r ? mapVideo(r) : null;
}

export function getProjectStorageBytes(projectId: string): number {
  const r = getDatabase().getFirstSync<any>(
    `SELECT COALESCE(SUM(size_bytes), 0) AS total FROM beta_videos WHERE project_id = ?`,
    [projectId],
  );
  return r?.total ?? 0;
}

export function insertVideo(v: Omit<BetaVideo, 'createdAt' | 'attemptId'> & { attemptId?: string | null }): void {
  getDatabase().runSync(
    `INSERT INTO beta_videos (id, project_id, attempt_id, local_uri, duration_sec, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [v.id, v.projectId, v.attemptId ?? null, v.localUri, v.durationSec, v.sizeBytes, Date.now()],
  );
  dbEvents.emit();
}

/** Deletes the clip row (notes cascade) and its file. */
export function deleteVideo(videoId: string): void {
  const video = getVideo(videoId);
  if (!video) return;
  getDatabase().runSync(`DELETE FROM beta_videos WHERE id = ?`, [videoId]);
  deleteClipFile(video.localUri);
  dbEvents.emit();
}

export function getNotesForVideo(videoId: string): VideoNote[] {
  return getDatabase()
    .getAllSync<any>(`SELECT * FROM video_notes WHERE video_id = ? ORDER BY timestamp_sec ASC`, [videoId])
    .map(mapNote);
}

export function addVideoNote(videoId: string, timestampSec: number, text: string): string {
  const id = uuid();
  getDatabase().runSync(`INSERT INTO video_notes (id, video_id, timestamp_sec, text) VALUES (?, ?, ?, ?)`, [
    id,
    videoId,
    Math.max(0, timestampSec),
    text.trim(),
  ]);
  dbEvents.emit();
  return id;
}

export function deleteVideoNote(noteId: string): void {
  getDatabase().runSync(`DELETE FROM video_notes WHERE id = ?`, [noteId]);
  dbEvents.emit();
}

// ─── Cascade ──────────────────────────────────────────────────────────────────

/**
 * Deletes a project's beta data and clip files. The DB rows (betas, moves, videos, notes)
 * go via ON DELETE CASCADE when the project row is removed; this removes the files first.
 * `removeProjectRow` lets the caller perform the actual project delete (so outbox logic stays in queries.ts).
 */
export function cascadeDeleteProjectBeta(projectId: string, removeProjectRow: () => void): void {
  const files = videoFilesToDelete(getVideosForProject(projectId));
  removeProjectRow();
  files.forEach(deleteClipFile);
  deleteProjectClipDir(projectId);
  dbEvents.emit();
}
