import type { Beta, BetaMove, BetaVideo } from '../types/beta';

// Pure business rules for Beta. No I/O, so everything here is unit-testable.

/** Next version number for a project: highest existing + 1 (1 when none). */
export function nextVersion(betas: Pick<Beta, 'version'>[]): number {
  return betas.reduce((max, b) => Math.max(max, b.version), 0) + 1;
}

/**
 * Returns a copy of `betas` where exactly `currentId` is current.
 * If `currentId` is not in the list the input is returned unchanged,
 * so the "exactly one current" invariant is never broken by a bad id.
 */
export function makeCurrent<T extends Pick<Beta, 'id' | 'isCurrent'>>(betas: T[], currentId: string): T[] {
  if (!betas.some((b) => b.id === currentId)) return betas;
  return betas.map((b) => ({ ...b, isCurrent: b.id === currentId }));
}

/**
 * After removing a version, make sure one remains current.
 * If the removed one was current, the highest version becomes current.
 */
export function pickCurrentAfterDelete<T extends Pick<Beta, 'id' | 'isCurrent' | 'version'>>(
  remaining: T[],
): T[] {
  if (remaining.length === 0 || remaining.some((b) => b.isCurrent)) return remaining;
  const newest = remaining.reduce((a, b) => (b.version > a.version ? b : a));
  return makeCurrent(remaining, newest.id);
}

/** Sorts by `order` and renumbers to 0..n-1 with no gaps. */
export function normalizeOrder<T extends Pick<BetaMove, 'order'>>(moves: T[]): T[] {
  return [...moves].sort((a, b) => a.order - b.order).map((m, i) => ({ ...m, order: i }));
}

/** Moves one item from `from` to `to` (indices into the ordered list) and renumbers. */
export function reorderMoves<T extends Pick<BetaMove, 'order'>>(moves: T[], from: number, to: number): T[] {
  const list = normalizeOrder(moves);
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return list;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  return list.map((m, i) => ({ ...m, order: i }));
}

/** Removes a move and renumbers. Also reports whether the crux must be cleared. */
export function removeMove<T extends Pick<BetaMove, 'id' | 'order'>>(
  moves: T[],
  moveId: string,
  cruxMoveId: string | null,
): { moves: T[]; cruxMoveId: string | null } {
  const next = normalizeOrder(moves.filter((m) => m.id !== moveId));
  return { moves: next, cruxMoveId: cruxMoveId === moveId ? null : cruxMoveId };
}

/** Toggles the crux: tapping the current crux clears it, otherwise it moves there. Only one crux. */
export function toggleCrux(cruxMoveId: string | null, moveId: string): string | null {
  return cruxMoveId === moveId ? null : moveId;
}

/** Drops blank moves (the editor allows empty rows while typing) and renumbers. */
export function stripEmptyMoves<T extends Pick<BetaMove, 'text' | 'order'>>(moves: T[]): T[] {
  return normalizeOrder(moves.filter((m) => m.text.trim().length > 0));
}

/** Local file URIs that must be deleted along with a project (cascade delete). */
export function videoFilesToDelete(videos: Pick<BetaVideo, 'localUri'>[]): string[] {
  return videos.map((v) => v.localUri).filter((u) => u.length > 0);
}

export function totalStorageBytes(videos: Pick<BetaVideo, 'sizeBytes'>[]): number {
  return videos.reduce((sum, v) => sum + (v.sizeBytes || 0), 0);
}

/** 83.4 -> "1:23". Negative or NaN -> "0:00". */
export function formatTimestamp(sec: number): string {
  const total = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return '<1 MB';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
