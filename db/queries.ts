import { getDerivedProjectStatus } from '../utils/projectStatus';
import { getDatabase } from './schema';

import type { Session, BoulderGroup, BoulderLog, FailureReason, Project, ProjectStatus, Outcome, Sector, Route, Attempt, HoldType, WallAngle, RouteStatus } from '../types';
import { v4 as uuid } from 'uuid';
import { dbEvents } from './events';

// ─── Sessions ────────────────────────────────────────────────────────────────

function runMutation(tableName: string, recordId: string, opType: 'INSERT' | 'UPDATE' | 'DELETE', sql: string, params: any[]) {
  const db = getDatabase();
  const now = Date.now();
  db.runSync(sql, params);
  
  if (opType !== 'DELETE') {
    db.runSync(`UPDATE ${tableName} SET sync_status = 'pending' WHERE id = ?`, [recordId]);
  }

  db.runSync(
    `INSERT INTO outbox (op_id, table_name, record_id, op_type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuid(), tableName, recordId, opType, '{}', now]
  );
  dbEvents.emit();
}

export function insertSession(session: Omit<Session, 'endTime'>): void {
  const db = getDatabase();
  const now = Date.now();
  runMutation('sessions', session.id, 'INSERT', 
    `INSERT INTO sessions (id, gym_name, started_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [session.id, session.gymName, session.startTime, session.notes, now, now]
  );
}

export function finishSession(id: string, endTime: number): void {
  const db = getDatabase();
  runMutation('sessions', id, 'UPDATE', `UPDATE sessions SET ended_at = ?, updated_at = ? WHERE id = ?`, [endTime, Date.now(), id]);
}

export function completeSessionWrapUp(
  id: string,
  endTime: number,
  title: string,
  notes: string,
  gymName: string,
  rpe: number | null,
  mediaUris: string[],
  skinState?: string | null,
  fingerFatigue?: string | null
): void {
  const db = getDatabase();
  const mediaJson = JSON.stringify(mediaUris);
  runMutation('sessions', id, 'UPDATE', 
    `UPDATE sessions 
     SET ended_at = ?, title = ?, notes = ?, gym_name = ?, rpe = ?, media_uris = ?, skin_state = ?, finger_fatigue = ?, updated_at = ?
     WHERE id = ?`,
    [endTime, title, notes, gymName, rpe, mediaJson, skinState ?? null, fingerFatigue ?? null, Date.now(), id]
  );
}

export function getAllSessions(): Session[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(`SELECT * FROM sessions ORDER BY started_at DESC`);
  return rows.map(mapSession);
}

export function getSessionById(id: string): Session | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>(`SELECT * FROM sessions WHERE id = ?`, [id]);
  return row ? mapSession(row) : null;
}

export function getActiveSession(): Session | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>(`SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1`);
  return row ? mapSession(row) : null;
}

export function updateSessionNotes(id: string, notes: string): void {
  const db = getDatabase();
  runMutation('sessions', id, 'UPDATE', `UPDATE sessions SET notes = ?, updated_at = ? WHERE id = ?`, [notes, Date.now(), id]);
}

export function updateSessionGym(id: string, gymName: string): void {
  const db = getDatabase();
  runMutation('sessions', id, 'UPDATE', `UPDATE sessions SET gym_name = ?, updated_at = ? WHERE id = ?`, [gymName, Date.now(), id]);
}

export function deleteSession(id: string): void {
  const db = getDatabase();
  runMutation('sessions', id, 'DELETE', `DELETE FROM sessions WHERE id = ?`, [id]);
}

function mapSession(row: any): Session {
  let mediaUris: string[] = [];
  if (row.media_uris) {
    try { mediaUris = JSON.parse(row.media_uris); } catch {}
  }
  return {
    id: row.id,
    startTime: row.started_at,
    endTime: row.ended_at,
    gymName: row.gym_name,
    notes: row.notes,
    title: row.title || '',
    rpe: row.rpe ?? null,
    mediaUris,
    skinState: row.skin_state ?? null,
    fingerFatigue: row.finger_fatigue ?? null,
  };
}

// ─── Shim for Boulder Groups & Logs ──────────────────────────────────────────

export function insertBoulderGroup(group: BoulderGroup): void {}
export function updateGroupZoneName(id: string, zoneName: string): void {}
export function updateGroupRestSeconds(id: string, defaultRestSeconds: number): void {}
export function updateGroupNotes(id: string, notes: string): void {}
export function updateGroupCompletion(id: string, isCompleted: boolean): void {}
export function deleteBoulderGroup(id: string): void {}
export function updateGroupOrder(id: string, sortOrder: number): void {}

export function getGroupsForSession(sessionId: string): BoulderGroup[] {
  return [{
    id: `group-${sessionId}`,
    sessionId,
    zoneName: 'Main Wall',
    order: 0,
    defaultRestSeconds: 90,
    notes: '',
    isCompleted: false,
  }];
}

export function insertBoulderLog(log: BoulderLog): void {
  const db = getDatabase();
  let sessionId = log.groupId.replace('group-', '');
  if (!sessionId.includes('-')) {
    const active = getActiveSession();
    if(active) sessionId = active.id;
  }
  const now = Date.now();
  runMutation('climbs', log.id, 'INSERT', 
    `INSERT INTO climbs (
      id, session_id, grade_index, grade_raw, result, attempts, rating, notes, photo_url, logged_at, failure_reason, wall_angle, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id, sessionId, log.normalizedDifficulty, log.gradeRaw, log.outcome, log.attempts, (log.rpe ?? null), (log.notes ?? null), (log.media_uri ?? null), log.timestamp, (log.failureReason ?? log.failure_reason ?? null), (log.wallAngle ?? null), now, now
    ]
  );
}

export function updateBoulderLog(log: BoulderLog): void {
  const db = getDatabase();
  runMutation('climbs', log.id, 'UPDATE', 
    `UPDATE climbs SET grade_raw = ?, grade_index = ?, rating = ?, attempts = ?, result = ?, photo_url = ?, notes = ?, failure_reason = ?, wall_angle = ?, updated_at = ? WHERE id = ?`,
    [log.gradeRaw, log.normalizedDifficulty, (log.rpe ?? null), log.attempts, log.outcome, (log.media_uri ?? null), (log.notes ?? null), (log.failureReason ?? log.failure_reason ?? null), (log.wallAngle ?? null), Date.now(), log.id]
  );
}

export function updateBoulderLogFailureReason(id: string, failureReason: FailureReason | null): void {
  const db = getDatabase();
  runMutation('climbs', id, 'UPDATE', `UPDATE climbs SET failure_reason = ?, updated_at = ? WHERE id = ?`, [failureReason, Date.now(), id]);
}

export function updateBoulderLogMedia(id: string, mediaUri: string | null, mediaType: string | null): void {
  const db = getDatabase();
  db.runSync(`UPDATE climbs SET photo_url = ?, updated_at = ? WHERE id = ?`, [mediaUri, Date.now(), id]);
}

export function updateBoulderLogGradeAndMedia(id: string, gradeRaw: string, normalizedDifficulty: number, mediaUri: string | null, mediaType: string | null, notes?: string | null): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE climbs SET grade_raw = ?, grade_index = ?, photo_url = ?, notes = ?, updated_at = ? WHERE id = ?`,
    [gradeRaw, normalizedDifficulty, mediaUri, notes ?? null, Date.now(), id]
  );
}


export function softDeleteBoulderLog(id: string): void {
  runMutation('climbs', id, 'UPDATE', `UPDATE climbs SET deleted_at = ?, updated_at = ? WHERE id = ?`, [Date.now(), Date.now(), id]);
}
export function undoDeleteBoulderLog(id: string): void {
  runMutation('climbs', id, 'UPDATE', `UPDATE climbs SET deleted_at = NULL, updated_at = ? WHERE id = ?`, [Date.now(), id]);
}

export function deleteBoulderLog(id: string): void {
  const db = getDatabase();
  runMutation('climbs', id, 'DELETE', `DELETE FROM climbs WHERE id = ?`, [id]);
}

export function getLogsForGroup(groupId: string): BoulderLog[] {
  const db = getDatabase();
  let sessionId = groupId.replace('group-', '');
  const rows = db.getAllSync<any>(`SELECT * FROM climbs WHERE session_id = ? ORDER BY logged_at`, [sessionId]);
  return rows.map(mapClimbToLog);
}

export function getLogsForSession(sessionId: string): BoulderLog[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(`SELECT * FROM climbs WHERE session_id = ? ORDER BY logged_at`, [sessionId]);
  return rows.map(mapClimbToLog);
}

function mapClimbToLog(r: any): BoulderLog {
  return {
    id: r.id,
    groupId: `group-${r.session_id}`,
    gradeRaw: r.grade_raw,
    normalizedDifficulty: r.grade_index,
    rpe: r.rating ?? null,
    attempts: r.attempts,
    outcome: r.result as BoulderLog['outcome'],
    timestamp: r.logged_at,
    media_uri: r.photo_url ?? null,
    media_type: r.photo_url ? 'photo' : null,
    notes: r.notes ?? null,
    failureReason: r.failure_reason as FailureReason ?? null,
    failure_reason: r.failure_reason as FailureReason ?? null,
    wallAngle: r.wall_angle ?? null,
  };
}

// ─── Ascents Shim ────────────────────────────────────────────────────────────
export function insertAscentMock(id: string, sessionId: string, gradeScalar: number, status: string, timestamp: number): void {
  const db = getDatabase();
  const now = Date.now();
  db.runSync(
    `INSERT INTO climbs (
      id, session_id, grade_index, grade_raw, result, attempts, logged_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, sessionId, gradeScalar, `V${gradeScalar}`, status.toLowerCase(), 1, timestamp, now, now]
  );
}

export function getAscentsForSession(sessionId: string): any[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(`SELECT * FROM climbs WHERE session_id = ? ORDER BY logged_at ASC`, [sessionId]);
  return rows.map(r => ({
    id: r.id,
    sessionId: r.session_id,
    gradeScalar: r.grade_index,
    status: r.result.toUpperCase(),
    timestamp: r.logged_at,
    isSynced: 0,
  }));
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function createProject(p: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): string {
  const db = getDatabase();
  const id = uuid();
  const now = Date.now();
  db.runSync(
    `INSERT INTO projects (id, title, grade_raw, grade_index, wall_angle, hold_type, status, high_water_mark_moves, total_moves, micro_beta, photo_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, p.title, p.gradeRaw, p.normalizedDifficulty, p.wallAngle, p.holdType, p.status, p.highWaterMarkMoves, p.totalMoves ?? null, p.microBeta ?? null, p.mediaUri ?? null, now, now]
  );
  return id;
}

export function updateProjectStatus(id: string, status: ProjectStatus): void {
  getDatabase().runSync(`UPDATE projects SET status = ?, updated_at = ? WHERE id = ?`, [status, Date.now(), id]);
}
export function updateProjectHighWaterMark(id: string, moves: number): void {
  getDatabase().runSync(`UPDATE projects SET high_water_mark_moves = ?, updated_at = ? WHERE id = ?`, [moves, Date.now(), id]);
}
export function updateProjectBeta(id: string, microBeta: string, mediaUri?: string | null): void {
  getDatabase().runSync(`UPDATE projects SET micro_beta = ?, photo_url = COALESCE(?, photo_url), updated_at = ? WHERE id = ?`, [microBeta, mediaUri ?? null, Date.now(), id]);
}
export function deleteProject(id: string): void {
  getDatabase().runSync(`DELETE FROM projects WHERE id = ?`, [id]);
}
export function getAllProjects(): Project[] {
  const rows = getDatabase().getAllSync<any>(`SELECT * FROM projects ORDER BY created_at DESC`);
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    gradeRaw: r.grade_raw,
    normalizedDifficulty: r.grade_index,
    wallAngle: r.wall_angle,
    holdType: r.hold_type,
    status: r.status,
    highWaterMarkMoves: r.high_water_mark_moves,
    totalMoves: r.total_moves,
    microBeta: r.micro_beta,
    mediaUri: r.photo_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function getGradePyramidData(timeframe: '30d' | '90d' | 'all' = 'all'): any[] {
  const db = getDatabase();
  const conditions: string[] = [];
  const params: number[] = [];
  const now = Date.now();

  if (timeframe === '30d') {
    conditions.push('logged_at >= ?');
    params.push(now - 30 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '90d') {
    conditions.push('logged_at >= ?');
    params.push(now - 90 * 24 * 60 * 60 * 1000);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.getAllSync<any>(
    `SELECT
       grade_raw,
       grade_index as normalized_difficulty,
       SUM(CASE WHEN result = 'flash' THEN 1 ELSE 0 END) AS flash_count,
       SUM(CASE WHEN result IN ('send', 'top') THEN 1 ELSE 0 END) AS top_count,
       SUM(CASE WHEN result = 'attempt' THEN 1 ELSE 0 END) AS attempt_count,
       COUNT(*) AS total_attempts
     FROM climbs
     ${where}
     GROUP BY grade_raw, grade_index
     ORDER BY grade_index ASC`,
    params
  );
  
  const result: any[] = [];
  let maxDiff = 8;
  const rowMap = new Map();
  for (const r of rows) {
    if (r.normalized_difficulty > maxDiff) maxDiff = Math.min(13, r.normalized_difficulty);
    rowMap.set(r.normalized_difficulty, r);
  }

  for (let diff = 0; diff <= maxDiff; diff++) {
    const existing = rowMap.get(diff);
    const flash_count = existing?.flash_count ?? 0;
    const top_count = existing?.top_count ?? 0;
    const attempt_count = existing?.attempt_count ?? 0;
    const grade_raw = existing?.grade_raw ?? (diff >= 13 ? 'V13+' : `V${diff}`);

    result.push({
      grade_raw,
      normalized_difficulty: diff,
      flash_count,
      top_count,
      attempt_count,
      total_sends: flash_count + top_count,
      total_attempts: existing?.total_attempts ?? (flash_count + top_count + attempt_count),
    });
  }
  return result;
}

export function getWeeklyVolumeTrends(timeframe: '30d' | '90d' | 'all' = 'all'): any {
  const db = getDatabase();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weeksCount = 8;
  const windowStart = now - (weeksCount * ONE_WEEK_MS);

  const rows = db.getAllSync<any>(
    `SELECT logged_at, result, attempts, grade_index
     FROM climbs WHERE logged_at >= ? ORDER BY logged_at ASC`, [windowStart]
  );

  const buckets = Array.from({ length: weeksCount }, () => ({ sends: 0, attempts: 0, grades: [] as number[] }));

  for (const log of rows) {
    const elapsed = log.logged_at - windowStart;
    const weekIdx = Math.min(weeksCount - 1, Math.max(0, Math.floor(elapsed / ONE_WEEK_MS)));
    const isSend = log.result === 'flash' || log.result === 'send' || log.result === 'top';
    if (isSend) {
      buckets[weekIdx].sends += 1;
      buckets[weekIdx].grades.push(log.grade_index);
    }
    buckets[weekIdx].attempts += Math.max(1, log.attempts);
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = buckets.map((b, i) => {
    const weekStart = windowStart + i * ONE_WEEK_MS;
    const d = new Date(weekStart);
    const avgScore = b.grades.length > 0 ? b.grades.reduce((acc, c) => acc + c, 0) / b.grades.length : 0;
    return {
      week_label: `W${i + 1}`,
      date_label: `${months[d.getMonth()]} ${d.getDate()}`,
      week_index: i,
      send_count: b.sends,
      attempt_count: b.attempts,
      avg_grade: b.grades.length > 0 ? `V${Math.round(avgScore)}` : '—',
    };
  });

  const currentWeekBurns = weeks[7]?.attempt_count ?? 0;
  const prevWeekBurns = weeks[6]?.attempt_count ?? 0;
  let trend_percentage = prevWeekBurns > 0 ? Math.round(((currentWeekBurns - prevWeekBurns) / prevWeekBurns) * 100) : (currentWeekBurns > 0 ? 100 : 0);
  let trend_direction = trend_percentage > 0 ? 'up' : (trend_percentage < 0 ? 'down' : 'flat');

  return { weeks, trend_percentage, trend_direction, trend_label: `${trend_percentage > 0 ? '+' : ''}${trend_percentage}% vs last week` };
}

export function getWallAngleBreakdown(timeframe: '30d' | '90d' | 'all' = 'all'): any[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(`SELECT wall_angle, notes, result FROM climbs`);
  const counts = { Overhang: 0, Slab: 0, Vertical: 0, Roof: 0 };
  
  for (const r of rows) {
    const text = `${r.notes ?? ''} ${r.wall_angle ?? ''}`.toLowerCase();
    if (text.includes('roof') || text.includes('cave')) counts.Roof += 1;
    else if (text.includes('overhang') || text.includes('steep')) counts.Overhang += 1;
    else if (text.includes('slab')) counts.Slab += 1;
    else counts.Vertical += 1;
  }
  const total = counts.Overhang + counts.Slab + counts.Vertical + counts.Roof;
  if (total === 0) return [
    { style: 'Overhang', percentage: 42, count: 0, color: '#8E7CFF' },
    { style: 'Slab', percentage: 26, count: 0, color: '#6EE756' },
    { style: 'Vertical', percentage: 20, count: 0, color: '#38BDF8' },
    { style: 'Roof', percentage: 12, count: 0, color: '#F59E0B' },
  ];
  const calcPct = (cnt: number) => Math.round((cnt / total) * 100);
  return [
    { style: 'Overhang', percentage: calcPct(counts.Overhang), count: counts.Overhang, color: '#8E7CFF' },
    { style: 'Slab', percentage: calcPct(counts.Slab), count: counts.Slab, color: '#6EE756' },
    { style: 'Vertical', percentage: calcPct(counts.Vertical), count: counts.Vertical, color: '#38BDF8' },
    { style: 'Roof', percentage: calcPct(counts.Roof), count: counts.Roof, color: '#F59E0B' },
  ];
}

export function getAngleMasteryBreakdown(timeframe: '30d' | '90d' | 'all' = 'all'): any[] {
  return [
    { angle: 'Overhang', sendRate: 0, totalSends: 0, totalAttempts: 0, color: '#8E7CFF' },
    { angle: 'Slab', sendRate: 0, totalSends: 0, totalAttempts: 0, color: '#6EE756' },
    { angle: 'Vertical', sendRate: 0, totalSends: 0, totalAttempts: 0, color: '#38BDF8' }
  ];
}

export function getHomeStats(): any { 
  return {
    sendsThisWeek: 0,
    attemptsThisWeek: 0,
    restDaysRatio: 0,
    hardestSendRaw: 'V0',
    hardestSendDiff: 0,
    sessionsThisWeek: 0,
    recentSessions: []
  }; 
}

export function seedDefaultRoutinesIfEmpty(): void {}


export function insertAttempt(attempt: any): void {
  const db = getDatabase();
  const now = Date.now();
  runMutation('climbs', attempt.id, 'INSERT', 
    `INSERT INTO climbs (
      id, session_id, project_id, grade_raw, grade_index, wall_angle, hold_type, result, attempts, logged_at, failure_reason, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attempt.id,
      attempt.sessionId,
      attempt.projectId || null,
      attempt.gradeRaw,
      attempt.normalizedDifficulty,
      (attempt.wallAngle ?? null),
      (attempt.holdType ?? null),
      (attempt.outcome ?? null),
      attempt.attemptNumber,
      attempt.timestamp,
      attempt.failureReason || null,
      now, now
    ]
  );
}

export function updateAttemptFailureReason(attemptId: string, reason: string | null): void {
  const db = getDatabase();
  runMutation('climbs', attemptId, 'UPDATE', `UPDATE climbs SET failure_reason = ?, updated_at = ? WHERE id = ?`, [reason, Date.now(), attemptId]);
}

export type SessionDetailData = any;
export type GradePyramidRow = any;
export type GradePyramidDataRow = any;
export type GradePyramidAllTimeRow = any;
export type AngleMasteryItem = any;
export type RecentBoulderLog = any;
export type HomeStats = any;
export type SessionSummary = any;
export type WeeklyCapsuleOverviewData = any;
export type GradeVolumeEqualizerData = any;
export type SessionTrendPoint = any;
export type AnalyticsOverview = any;
export type RecentOutcomesSummaryData = any;
export type OutcomeSegmentData = any;
export type WallAngleBreakdownItem = any;
export type WeeklyVolumeTrendsData = any;
export type DisciplineSplitItem = any;
export type FailureBreakdownData = any;
export type WeeklyVolumeStat = any;

export function updateSessionConditions(sessionId: string, conditions: string[]): void {}

export function insertProject(project: any): void {
  const db = getDatabase();
  const now = Date.now();
  runMutation('projects', project.id, 'INSERT', 
    `INSERT INTO projects (id, title, grade_raw, grade_index, wall_angle, hold_type, status, high_water_mark_moves, total_moves, micro_beta, photo_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [project.id, project.title, project.gradeRaw, project.normalizedDifficulty, project.wallAngle, project.holdType, project.status, project.highWaterMarkMoves, project.totalMoves ?? null, (project.microBeta ?? null), (project.mediaUri ?? null), now, now]
  );
}

export function gradeToNumeric(gradeRaw: string): number {
  return parseInt(gradeRaw.replace('V', '')) || 0;
}

export function getClimbsForSession(sessionId: string): any[] {
  const db = getDatabase();
  return db.getAllSync(`
    SELECT c.*, p.title as projectTitle 
    FROM climbs c 
    LEFT JOIN projects p ON c.project_id = p.id 
    WHERE c.session_id = ? 
    ORDER BY c.logged_at DESC
  `, [sessionId]);
}

export function getAllSessionSummaries(): any[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(`SELECT * FROM sessions ORDER BY started_at DESC`);
  return rows.map(mapSession);
}

export function getAnalyticsOverview(): AnalyticsOverview { return {}; }
export function getRecentBoulderLogs(): RecentBoulderLog[] { return []; }
export function getRecentOutcomesSummary(): RecentOutcomesSummaryData { return {}; }
export function getGradeVolumeEqualizerData(): GradeVolumeEqualizerData { return {}; }
export function clearAllSessionData(): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM climbs`);
  db.runSync(`DELETE FROM sessions`);
  db.runSync(`DELETE FROM outbox`);
  dbEvents.emit();
}

export function getSessionSummary(sessionId: string) {
  const db = getDatabase();
  const session = db.getFirstSync<any>(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
  const climbs = db.getAllSync<any>(`SELECT * FROM climbs WHERE session_id = ?`, [sessionId]);

  const sends = climbs.filter((c: any) => c.result === 'send' || c.result === 'flash' || c.result === 'top');
  const flashes = climbs.filter((c: any) => c.result === 'flash');
  const hardest = sends.reduce((max: any, c: any) => {
    if (!max || c.grade_index > max.grade_index) return c;
    return max;
  }, null);

  const duration = session
    ? ((session.ended_at || Date.now()) - session.started_at)
    : 0;

  return {
    duration,
    climbs: climbs.length,
    sends: sends.length,
    flashes: flashes.length,
    hardestGradeRaw: hardest?.grade_raw ?? '–',
    hardestGradeIndex: hardest?.grade_index ?? 0,
    gymName: session?.gym_name ?? '',
    startedAt: session?.started_at ?? 0,
    endedAt: session?.ended_at ?? 0,
  };
}


const PERIOD_MS = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
  'all': 0
};

export type ProgressPeriod = keyof typeof PERIOD_MS;

function getSince(period: ProgressPeriod, nowMs: number = Date.now()): number {
  const ms = PERIOD_MS[period] || 0;
  return ms === 0 ? 0 : nowMs - ms;
}

// 1. Result counts (Flash / Send / Attempt) for donut
export function getResultCounts(period: ProgressPeriod, nowMs: number = Date.now()) {
  const since = getSince(period, nowMs);
  const db = getDatabase();
  const rows = db.getAllSync<{ result: string, count: number }>(`
    SELECT result, COUNT(*) as count 
    FROM climbs 
    WHERE logged_at >= ? AND deleted_at IS NULL
    GROUP BY result
  `, [since]);
  
  let flash = 0;
  let top = 0;
  let attempt = 0;
  
  for (const row of rows) {
    if (row.result === 'flash') flash += row.count;
    else if (row.result === 'send' || row.result === 'top') top += row.count;
    else attempt += row.count; // 'attempt', 'fall', 'fail', etc
  }
  
  return { flash, top, attempt };
}

// 2. Average grade of last 20 climbs
export function getAverageGradeLast20() {
  const db = getDatabase();
  const rows = db.getAllSync<{ grade_index: number }>(`
    SELECT grade_index 
    FROM climbs 
    WHERE deleted_at IS NULL AND (result = 'send' OR result = 'top' OR result = 'flash')
    ORDER BY logged_at DESC 
    LIMIT 20
  `);
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, r) => acc + r.grade_index, 0);
  return Math.round(sum / rows.length);
}

// 3. Sends per grade (Grade Pyramid)
// Rule: a problem sent several times counts once in the pyramid. 
// For quick logs (project_id IS NULL), they always count as distinct sends.
export function getGradePyramid(period: ProgressPeriod, nowMs: number = Date.now()) {
  const since = getSince(period, nowMs);
  const db = getDatabase();
  
  // We want to count distinct (project_id) for sends, but if project_id is null, it's its own send.
  // We can use a trick: group by COALESCE(project_id, id)
  const rows = db.getAllSync<{ grade_index: number, result: string, count: number }>(`
    SELECT grade_index, result, COUNT(*) as count
    FROM (
      SELECT grade_index, result, 
             ROW_NUMBER() OVER(PARTITION BY COALESCE(project_id, id) ORDER BY logged_at ASC) as rn
      FROM climbs
      WHERE logged_at >= ? AND deleted_at IS NULL AND (result = 'send' OR result = 'top' OR result = 'flash')
    )
    WHERE rn = 1
    GROUP BY grade_index, result
  `, [since]);

  // wait, sqlite 3.25+ supports window functions. expo-sqlite does.
  // But wait, what if they attempt and then send? We only want sends.
  // We already filter by result in ('send', 'top', 'flash'). So rn=1 just gives the first send.
  
  // Also we want attempts in the pyramid? Spec says "sends per grade". The pyramid usually shows Flash, Send.
  // So we aggregate flash/send.
  
  const grades = new Map<number, { grade: number, flashes: number, sends: number }>();
  for (const row of rows) {
    if (!grades.has(row.grade_index)) {
      grades.set(row.grade_index, { grade: row.grade_index, flashes: 0, sends: 0 });
    }
    const stat = grades.get(row.grade_index)!;
    if (row.result === 'flash') stat.flashes += row.count;
    else stat.sends += row.count;
  }
  
  return Array.from(grades.values()).sort((a, b) => b.grade - a.grade); // Descending grade
}

// 4. Weekly volume (climbs per week)
export function getWeeklyVolume(period: ProgressPeriod, nowMs: number = Date.now()) {
  const since = getSince(period, nowMs);
  const db = getDatabase();
  // SQLite strftime('%Y-%W') gives Year-Week (Monday start).
  // But we want climbs per week over the period.
  const rows = db.getAllSync<{ week: string, count: number }>(`
    SELECT strftime('%Y-%W', datetime(logged_at / 1000, 'unixepoch', 'localtime')) as week, 
           COUNT(*) as count
    FROM climbs
    WHERE logged_at >= ? AND deleted_at IS NULL
    GROUP BY week
    ORDER BY week ASC
  `, [since]);
  
  return rows;
}

// 5. Flash rate and send rate
export function getRates(period: ProgressPeriod, nowMs: number = Date.now()) {
  const since = getSince(period, nowMs);
  const db = getDatabase();
  const row = db.getFirstSync<{ total: number, flashes: number, sends: number }>(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN result = 'flash' THEN 1 ELSE 0 END) as flashes,
      SUM(CASE WHEN result = 'send' OR result = 'top' THEN 1 ELSE 0 END) as sends
    FROM climbs
    WHERE logged_at >= ? AND deleted_at IS NULL
  `, [since]);
  
  if (!row || row.total === 0) return { flashRate: 0, sendRate: 0 };
  return {
    flashRate: Math.round((row.flashes / row.total) * 100),
    sendRate: Math.round(((row.flashes + row.sends) / row.total) * 100)
  };
}

// 6. Hardest send over time (trend)
export function getHardestSendTrend(period: ProgressPeriod, nowMs: number = Date.now()) {
  const since = getSince(period, nowMs);
  const db = getDatabase();
  // Get max grade per week
  const rows = db.getAllSync<{ week: string, max_grade: number }>(`
    SELECT strftime('%Y-%W', datetime(logged_at / 1000, 'unixepoch', 'localtime')) as week, 
           MAX(grade_index) as max_grade
    FROM climbs
    WHERE logged_at >= ? AND deleted_at IS NULL AND (result = 'send' OR result = 'top' OR result = 'flash')
    GROUP BY week
    ORDER BY week ASC
  `, [since]);
  
  return rows;
}

// 7. Streak (consecutive Mon-Sun weeks with at least one session)
export function getStreak(nowMs: number = Date.now()) {
  const db = getDatabase();
  // Group sessions by year-week (Mon-Sun).
  // strftime('%Y-%W') gives week number.
  // Note: %W treats Monday as start of week.
  const rows = db.getAllSync<{ week: string }>(`
    SELECT DISTINCT strftime('%Y-%W', datetime(started_at / 1000, 'unixepoch', 'localtime')) as week
    FROM sessions
    WHERE deleted_at IS NULL
    ORDER BY week DESC
  `);
  
  if (rows.length === 0) return 0;
  
  // Calculate current week
  const currentWeek = new Date(nowMs);
  // Manual formatting to match SQLite '%Y-%W' can be tricky, 
  // so let's rely on parsing SQLite's response and just walking backwards.
  // Wait, if they missed this week, streak is 0?
  // Usually streak allows missing current week until Sunday.
  // Let's just count consecutive strings of weeks in the result array.
  
  let streak = 0;
  
  // To do this reliably, we can convert strings to actual week indices.
  const parseWeek = (yW: string) => {
    const [y, w] = yW.split('-');
    return parseInt(y) * 52 + parseInt(w);
  };
  
  if (rows.length > 0) {
    const lastWeekVal = parseWeek(rows[0].week);
    // Find expected current week val using SQLite (we can just ask sqlite)
    const currentRow = db.getFirstSync<{ week: string }>(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as week`, [Math.floor(nowMs/1000)]);
    const currentWeekVal = currentRow ? parseWeek(currentRow.week) : 0;
    
    // If the most recent session is older than last week, streak is 0.
    if (currentWeekVal - lastWeekVal > 1) {
      return 0;
    }
    
    streak = 1;
    let prevVal = lastWeekVal;
    
    for (let i = 1; i < rows.length; i++) {
      const val = parseWeek(rows[i].week);
      if (prevVal - val === 1) {
        streak++;
        prevVal = val;
      } else {
        break;
      }
    }
  }
  
  return streak;
}

export interface HomeSummary {
  activeSession: Session | null;
  activeSessionClimbCount: number;
  lastSession: { id: string; gymName: string; startTime: number; endTime: number; } | null;
  lastSessionRelative: string;
  sessionsThisWeek: number;
  climbsThisWeek: number;
  sendsThisWeek: number;
  flashesThisWeek: number;
  streak: number;
  weekDays: { dayLabel: string; date: string; hasSession: boolean; isToday: boolean }[];
  hardest30d: { gradeRaw: string; gradeIndex: number } | null;
  personalBest: { gradeRaw: string; daysAgo: number } | null;
  weeklyVolume: { weekLabel: string; climbs: number; isCurrent: boolean }[];
  weeklyVolumeChange: number;
  recentSessions: { id: string; gymName: string; startTime: number; durationMs: number; climbs: number; sends: number; hardestGradeRaw: string }[];
  projects: any[];
  hasAnyData: boolean;
}

export function getHomeSummary(): HomeSummary {
  const db = getDatabase();
  const nowMs = Date.now();
  
  const hasAnySession = db.getFirstSync<{ c: number }>(`SELECT COUNT(*) as c FROM sessions WHERE deleted_at IS NULL`)?.c || 0;
  
  let activeSession = getActiveSession();
  let activeSessionClimbCount = 0;
  if (activeSession) {
    const c = db.getFirstSync<{ c: number }>(`SELECT COUNT(*) as c FROM climbs WHERE session_id = ? AND deleted_at IS NULL`, [activeSession.id]);
    activeSessionClimbCount = c?.c || 0;
  }
  
  const d = new Date(nowMs);
  const dayOfWeek = d.getDay(); 
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayOfThisWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday);
  mondayOfThisWeek.setHours(0,0,0,0);
  const startOfWeekMs = mondayOfThisWeek.getTime();
  const endOfWeekMs = startOfWeekMs + 7 * 24 * 60 * 60 * 1000 - 1;

  const validSessions = db.getAllSync<any>(`
    SELECT s.*, 
           (SELECT COUNT(*) FROM climbs c WHERE c.session_id = s.id AND c.deleted_at IS NULL) as climb_count
    FROM sessions s
    WHERE s.deleted_at IS NULL
  `).filter(s => s.climb_count > 0).sort((a, b) => b.started_at - a.started_at);

  const completedSessions = validSessions.filter(s => s.ended_at !== null && s.id !== activeSession?.id);
  
  let lastSession = null;
  let lastSessionRelative = '';
  if (completedSessions.length > 0) {
    const ls = completedSessions[0];
    lastSession = {
      id: ls.id,
      gymName: ls.gym_name || '',
      startTime: ls.started_at,
      endTime: ls.ended_at,
    };
    
    const lsStart = new Date(ls.started_at);
    lsStart.setHours(0,0,0,0);
    const today = new Date(nowMs);
    today.setHours(0,0,0,0);
    const diffDays = Math.round((today.getTime() - lsStart.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) lastSessionRelative = 'Today';
    else if (diffDays === 1) lastSessionRelative = 'Yesterday';
    else if (diffDays <= 6) lastSessionRelative = `${diffDays} days ago`;
    else if (diffDays <= 13) lastSessionRelative = 'Last week';
    else lastSessionRelative = `${Math.floor(diffDays / 7)} weeks ago`;
  }
  
  let sessionsThisWeek = 0;
  let climbsThisWeek = 0;
  let sendsThisWeek = 0;
  let flashesThisWeek = 0;
  
  for (const s of validSessions) {
    if (s.started_at >= startOfWeekMs && s.started_at <= endOfWeekMs) {
      sessionsThisWeek++;
    }
  }
  
  const thisWeekClimbs = db.getAllSync<any>(`
    SELECT c.* FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.logged_at >= ? AND c.logged_at <= ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL
  `, [startOfWeekMs, endOfWeekMs]);
  
  climbsThisWeek = thisWeekClimbs.length;
  for (const c of thisWeekClimbs) {
    if (c.result === 'send' || c.result === 'top' || c.result === 'flash') sendsThisWeek++;
    if (c.result === 'flash') flashesThisWeek++;
  }
  
  let streak = 0;
  const sessionsByWeek = new Set<string>();
  for (const s of validSessions) {
    const res = db.getFirstSync<{w:string}>(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as w`, [Math.floor(s.started_at/1000)]);
    if (res?.w) sessionsByWeek.add(res.w);
  }
  
  const currentWeekStrRes = db.getFirstSync<{w:string}>(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as w`, [Math.floor(nowMs/1000)]);
  const currentWeekStr = currentWeekStrRes?.w || '';
  
  let checkMs = nowMs;
  let checkWeekStr = currentWeekStr;
  
  let hasSessionThisWeek = sessionsByWeek.has(checkWeekStr);
  
  let currentStreak = 0;
  if (hasSessionThisWeek) {
    currentStreak++;
    while (true) {
      checkMs -= 7 * 24 * 60 * 60 * 1000;
      const prevRes = db.getFirstSync<{w:string}>(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as w`, [Math.floor(checkMs/1000)]);
      if (prevRes?.w && sessionsByWeek.has(prevRes.w)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    checkMs -= 7 * 24 * 60 * 60 * 1000;
    const prevRes = db.getFirstSync<{w:string}>(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as w`, [Math.floor(checkMs/1000)]);
    if (prevRes?.w && sessionsByWeek.has(prevRes.w)) {
      currentStreak++;
      while (true) {
        checkMs -= 7 * 24 * 60 * 60 * 1000;
        const p2 = db.getFirstSync<{w:string}>(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as w`, [Math.floor(checkMs/1000)]);
        if (p2?.w && sessionsByWeek.has(p2.w)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }
  streak = currentStreak;
  
  const weekDays = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = new Date(nowMs).getDate();
  const todayMonth = new Date(nowMs).getMonth();
  for (let i = 0; i < 7; i++) {
    const cur = new Date(mondayOfThisWeek.getTime() + i * 24 * 60 * 60 * 1000);
    const hasSess = validSessions.some(s => {
      const sd = new Date(s.started_at);
      return sd.getDate() === cur.getDate() && sd.getMonth() === cur.getMonth() && sd.getFullYear() === cur.getFullYear();
    });
    weekDays.push({
      dayLabel: dayNames[cur.getDay()].substring(0, 3),
      date: cur.toISOString().split('T')[0],
      hasSession: hasSess,
      isToday: cur.getDate() === todayDay && cur.getMonth() === todayMonth,
    });
  }
  
  const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000;
  const hardest30dRow = db.getFirstSync<any>(`
    SELECT c.grade_raw, c.grade_index FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.logged_at >= ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')
    ORDER BY grade_index DESC LIMIT 1
  `, [thirtyDaysAgo]);
  
  const hardest30d = hardest30dRow ? { gradeRaw: hardest30dRow.grade_raw, gradeIndex: hardest30dRow.grade_index } : null;
  
  const allTimeHardestRow = db.getFirstSync<any>(`
    SELECT c.grade_raw, c.grade_index FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.deleted_at IS NULL AND s.deleted_at IS NULL AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')
    ORDER BY grade_index DESC LIMIT 1
  `);
  let personalBest = null;
  if (allTimeHardestRow) {
    const hardestGrade = allTimeHardestRow.grade_index;
    const firstTimeRow = db.getFirstSync<any>(`
      SELECT c.logged_at FROM climbs c
      JOIN sessions s ON c.session_id = s.id
      WHERE c.grade_index = ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')
      ORDER BY logged_at ASC LIMIT 1
    `, [hardestGrade]);
    
    if (firstTimeRow) {
      const daysAgo = Math.floor((nowMs - firstTimeRow.logged_at) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 14) {
        // Check if there was a previous best to beat (i.e., any climb logged before this one)
        const previousClimbs = db.getFirstSync<any>(`
          SELECT COUNT(*) as c FROM climbs c
          JOIN sessions s ON c.session_id = s.id
          WHERE c.logged_at < ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL
        `, [firstTimeRow.logged_at]);
        
        if (previousClimbs && previousClimbs.c > 0) {
          personalBest = { gradeRaw: allTimeHardestRow.grade_raw, daysAgo };
        }
      }
    }
  }
  
  const weeklyVolume = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let currentWeekVolume = 0;
  let lastWeekVolume = 0;
  
  for (let i = 7; i >= 0; i--) {
    const wStart = new Date(startOfWeekMs - i * 7 * 24 * 60 * 60 * 1000);
    const wEnd = wStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1;
    
    const count = db.getFirstSync<{c:number}>(`
      SELECT COUNT(*) as c FROM climbs 
      WHERE logged_at >= ? AND logged_at <= ? AND deleted_at IS NULL
    `, [wStart.getTime(), wEnd])?.c || 0;
    
    weeklyVolume.push({
      weekLabel: `${monthNames[wStart.getMonth()]} ${wStart.getDate()}`,
      climbs: count,
      isCurrent: i === 0
    });
    
    if (i === 0) currentWeekVolume = count;
    if (i === 1) lastWeekVolume = count;
  }
  
  let weeklyVolumeChange = 0;
  if (lastWeekVolume > 0) {
    weeklyVolumeChange = Math.round(((currentWeekVolume - lastWeekVolume) / lastWeekVolume) * 100);
  } else if (currentWeekVolume > 0) {
    weeklyVolumeChange = 100;
  }
  
  const recentSessions = completedSessions.slice(0, 3).map(s => {
    const cRows = db.getAllSync<any>(`SELECT grade_raw, grade_index, result FROM climbs WHERE session_id = ? AND deleted_at IS NULL`, [s.id]);
    const sendsRows = cRows.filter(c => c.result === 'send' || c.result === 'top' || c.result === 'flash');
    let hg = '–';
    if (sendsRows.length > 0) {
      sendsRows.sort((a,b) => b.grade_index - a.grade_index);
      hg = sendsRows[0].grade_raw;
    }
    return {
      id: s.id,
      gymName: s.gym_name || '',
      startTime: s.started_at,
      durationMs: (s.ended_at || nowMs) - s.started_at,
      climbs: cRows.length,
      sends: sendsRows.length,
      hardestGradeRaw: hg
    };
  });
  
  const projects = getAllProjects().filter(p => p.status === 'in_progress');
  
  return {
    activeSession,
    activeSessionClimbCount,
    lastSession,
    lastSessionRelative,
    sessionsThisWeek,
    climbsThisWeek,
    sendsThisWeek,
    flashesThisWeek,
    streak,
    weekDays,
    hardest30d,
    personalBest,
    weeklyVolume,
    weeklyVolumeChange,
    recentSessions,
    projects,
    hasAnyData: hasAnySession > 0,
  };
}

export function getRecentGrades(): { gradeRaw: string, gradeIndex: number }[] {
  const db = getDatabase();
  
  const recentRows = db.getAllSync<any>(`
    SELECT grade_raw, grade_index, MAX(logged_at) as last_logged
    FROM climbs 
    WHERE deleted_at IS NULL
    GROUP BY grade_raw, grade_index
    ORDER BY last_logged DESC
    LIMIT 5
  `);
  
  const recentGrades = recentRows.map(r => ({ gradeRaw: r.grade_raw, gradeIndex: r.grade_index }));
  
  if (recentGrades.length === 5) {
    return recentGrades.sort((a, b) => a.gradeIndex - b.gradeIndex);
  }

  const allClimbs = db.getAllSync<any>(`
    SELECT grade_index FROM climbs WHERE deleted_at IS NULL ORDER BY grade_index ASC
  `);
  
  let medianIndex = 2; // Default to V2 if no climbs
  if (allClimbs.length > 0) {
    const mid = Math.floor(allClimbs.length / 2);
    medianIndex = allClimbs[mid].grade_index;
  }
  
  const fillCandidates = [
    medianIndex,
    medianIndex + 1,
    medianIndex - 1,
    medianIndex + 2,
    medianIndex - 2,
  ];
  
  const resultMap = new Map();
  for (const g of recentGrades) {
    resultMap.set(g.gradeIndex, g.gradeRaw);
  }
  
  for (const idx of fillCandidates) {
    if (resultMap.size >= 5) break;
    if (idx >= 0 && !resultMap.has(idx)) {
      resultMap.set(idx, `V${idx}`);
    }
  }
  
  let fallbackIdx = 0;
  while (resultMap.size < 5 && fallbackIdx < 17) {
    if (!resultMap.has(fallbackIdx)) {
      resultMap.set(fallbackIdx, `V${fallbackIdx}`);
    }
    fallbackIdx++;
  }
  
  const finalGrades = Array.from(resultMap.entries()).map(([index, raw]) => ({
    gradeIndex: index,
    gradeRaw: raw
  }));
  
  return finalGrades.sort((a, b) => a.gradeIndex - b.gradeIndex);
}



export function getRichProjects(): any[] {
  const db = getDatabase();
  const projects = db.getAllSync<any>(`SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC`);
  
  const climbs = db.getAllSync<any>(`
    SELECT c.project_id, c.session_id, c.logged_at, s.gym_name
    FROM climbs c
    LEFT JOIN sessions s ON c.session_id = s.id
    WHERE c.project_id IS NOT NULL AND c.deleted_at IS NULL
    ORDER BY c.logged_at DESC
  `);

  return projects.map(p => {
    const pClimbs = climbs.filter((c: any) => c.project_id === p.id);
    const lastClimb = pClimbs[0];
    const gymName = lastClimb ? lastClimb.gym_name : null;
    const lastTriedAt = lastClimb ? lastClimb.logged_at : null;
    
    const sessionMap = new Map();
    for (const c of pClimbs) {
       sessionMap.set(c.session_id, (sessionMap.get(c.session_id) || 0) + 1);
    }
    const burnsPerSession = Array.from(sessionMap.values()).slice(0, 6).reverse();

    const statusChip = getDerivedProjectStatus(pClimbs.length, p.high_water_mark_moves, p.total_moves);

    return {
      id: p.id,
      title: p.title,
      gradeRaw: p.grade_raw,
      normalizedDifficulty: p.grade_index,
      wallAngle: p.wall_angle,
      holdType: p.hold_type,
      status: p.status,
      highWaterMarkMoves: p.high_water_mark_moves,
      totalMoves: p.total_moves,
      microBeta: p.micro_beta,
      attempts: pClimbs.length,
      gymName,
      lastTriedAt,
      burnsPerSession,
      statusChip,
      createdAt: p.created_at,
    };
  });
}

export function getRichProjectById(id: string): any | null {
  const all = getRichProjects();
  return all.find((p: any) => p.id === id) || null;
}

export function getProjectHistory(projectId: string): any[] {
  const db = getDatabase();
  const climbs = db.getAllSync<any>(`
    SELECT c.id, c.session_id, c.logged_at, c.attempts, c.result, s.started_at
    FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.project_id = ? AND c.deleted_at IS NULL
    ORDER BY c.logged_at DESC
  `, [projectId]);
  
  const sessions = new Map();
  for (const c of climbs) {
    if (!sessions.has(c.session_id)) {
      sessions.set(c.session_id, {
        sessionId: c.session_id,
        date: c.started_at,
        burns: 0,
        bestResult: 'attempt',
        bestMoves: 0
      });
    }
    const sess = sessions.get(c.session_id);
    sess.burns += (c.attempts || 1);
    if (c.result === 'send' || c.result === 'top' || c.result === 'flash') {
      sess.bestResult = 'send';
    }
  }
  return Array.from(sessions.values()).sort((a, b) => b.date - a.date);
}
