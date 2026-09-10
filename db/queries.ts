import { getDatabase } from './schema';
import type { Session, BoulderGroup, BoulderLog } from '../types';

// ─── Sessions ────────────────────────────────────────────────────────────────

export function insertSession(session: Omit<Session, 'endTime'>): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO sessions (id, start_time, gym_name, notes)
     VALUES (?, ?, ?, ?)`,
    [session.id, session.startTime, session.gymName, session.notes]
  );
}

export function finishSession(id: string, endTime: number): void {
  const db = getDatabase();
  db.runSync(`UPDATE sessions SET end_time = ? WHERE id = ?`, [endTime, id]);
}

export function getAllSessions(): Session[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    start_time: number;
    end_time: number | null;
    gym_name: string;
    notes: string;
  }>(`SELECT * FROM sessions ORDER BY start_time DESC`);
  return rows.map(mapSession);
}

export function getSessionById(id: string): Session | null {
  const db = getDatabase();
  const row = db.getFirstSync<{
    id: string;
    start_time: number;
    end_time: number | null;
    gym_name: string;
    notes: string;
  }>(`SELECT * FROM sessions WHERE id = ?`, [id]);
  return row ? mapSession(row) : null;
}

export function updateSessionNotes(id: string, notes: string): void {
  const db = getDatabase();
  db.runSync(`UPDATE sessions SET notes = ? WHERE id = ?`, [notes, id]);
}

export function updateSessionGym(id: string, gymName: string): void {
  const db = getDatabase();
  db.runSync(`UPDATE sessions SET gym_name = ? WHERE id = ?`, [gymName, id]);
}

export function reopenSession(id: string): void {
  const db = getDatabase();
  db.runSync(`UPDATE sessions SET end_time = NULL WHERE id = ?`, [id]);
}

export function deleteSession(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM sessions WHERE id = ?`, [id]);
}

function mapSession(row: {
  id: string;
  start_time: number;
  end_time: number | null;
  gym_name: string;
  notes: string;
}): Session {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    gymName: row.gym_name,
    notes: row.notes,
  };
}

// ─── Boulder Groups ───────────────────────────────────────────────────────────

export function insertBoulderGroup(group: BoulderGroup): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO boulder_groups (id, session_id, zone_name, sort_order)
     VALUES (?, ?, ?, ?)`,
    [group.id, group.sessionId, group.zoneName, group.order]
  );
}

export function updateGroupZoneName(id: string, zoneName: string): void {
  const db = getDatabase();
  db.runSync(`UPDATE boulder_groups SET zone_name = ? WHERE id = ?`, [zoneName, id]);
}

export function getGroupsForSession(sessionId: string): BoulderGroup[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    session_id: string;
    zone_name: string;
    sort_order: number;
  }>(
    `SELECT * FROM boulder_groups WHERE session_id = ? ORDER BY sort_order`,
    [sessionId]
  );
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    zoneName: r.zone_name,
    order: r.sort_order,
  }));
}

// ─── Boulder Logs ─────────────────────────────────────────────────────────────

export function insertBoulderLog(log: BoulderLog): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO boulder_logs
       (id, group_id, grade_raw, normalized_difficulty, rpe, attempts, outcome, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.groupId,
      log.gradeRaw,
      log.normalizedDifficulty,
      log.rpe ?? null,
      log.attempts,
      log.outcome,
      log.timestamp,
    ]
  );
}

export function updateBoulderLog(log: BoulderLog): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE boulder_logs
     SET grade_raw = ?, normalized_difficulty = ?, rpe = ?, attempts = ?, outcome = ?
     WHERE id = ?`,
    [log.gradeRaw, log.normalizedDifficulty, log.rpe ?? null, log.attempts, log.outcome, log.id]
  );
}

export function deleteBoulderLog(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM boulder_logs WHERE id = ?`, [id]);
}

export function getLogsForGroup(groupId: string): BoulderLog[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    group_id: string;
    grade_raw: string;
    normalized_difficulty: number;
    rpe: number | null;
    attempts: number;
    outcome: string;
    timestamp: number;
  }>(
    `SELECT * FROM boulder_logs WHERE group_id = ? ORDER BY timestamp`,
    [groupId]
  );
  return rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    gradeRaw: r.grade_raw,
    normalizedDifficulty: r.normalized_difficulty,
    rpe: r.rpe ?? null,
    attempts: r.attempts,
    outcome: r.outcome as BoulderLog['outcome'],
    timestamp: r.timestamp,
  }));
}

export function getLogsForSession(sessionId: string): BoulderLog[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    group_id: string;
    grade_raw: string;
    normalized_difficulty: number;
    rpe: number | null;
    attempts: number;
    outcome: string;
    timestamp: number;
  }>(
    `SELECT bl.* FROM boulder_logs bl
     JOIN boulder_groups bg ON bl.group_id = bg.id
     WHERE bg.session_id = ?
     ORDER BY bl.timestamp`,
    [sessionId]
  );
  return rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    gradeRaw: r.grade_raw,
    normalizedDifficulty: r.normalized_difficulty,
    rpe: r.rpe ?? null,
    attempts: r.attempts,
    outcome: r.outcome as BoulderLog['outcome'],
    timestamp: r.timestamp,
  }));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface GradePyramidRow {
  gradeRaw: string;
  normalizedDifficulty: number;
  flashes: number;
  sends: number;
  attempts: number;
}

/** Aggregate sends/flashes/attempts per grade — pass null for lifetime */
export function getGradePyramid(sessionId: string | null, sinceTimestamp?: number): GradePyramidRow[] {
  const db = getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  let join = '';
  if (sessionId) {
    join = 'JOIN boulder_groups bg ON bl.group_id = bg.id';
    conditions.push('bg.session_id = ?');
    params.push(sessionId);
  }

  if (sinceTimestamp != null) {
    conditions.push('bl.timestamp >= ?');
    params.push(sinceTimestamp);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = db.getAllSync<{
    grade_raw: string;
    normalized_difficulty: number;
    flashes: number;
    sends: number;
    attempts: number;
  }>(
    `SELECT
       bl.grade_raw,
       bl.normalized_difficulty,
       SUM(CASE WHEN bl.outcome = 'flash'   THEN 1 ELSE 0 END) AS flashes,
       SUM(CASE WHEN bl.outcome = 'send'    THEN 1 ELSE 0 END) AS sends,
       SUM(CASE WHEN bl.outcome = 'attempt' THEN 1 ELSE 0 END) AS attempts
     FROM boulder_logs bl
     ${join}
     ${where}
     GROUP BY bl.grade_raw, bl.normalized_difficulty
     ORDER BY bl.normalized_difficulty DESC`,
    params
  );
  return rows.map((r) => ({
    gradeRaw: r.grade_raw,
    normalizedDifficulty: r.normalized_difficulty,
    flashes: r.flashes,
    sends: r.sends,
    attempts: r.attempts,
  }));
}

export interface LifetimeStats {
  totalSessions: number;
  totalSends: number;
  totalAttempts: number;
  avgSessionMinutes: number;
  hardestSend: string | null;
}

export function getLifetimeStats(): LifetimeStats {
  const db = getDatabase();
  const counts = db.getFirstSync<{
    total_sessions: number;
    total_sends: number;
    total_attempts: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM sessions) AS total_sessions,
       SUM(CASE WHEN outcome IN ('send','flash') THEN 1 ELSE 0 END) AS total_sends,
       SUM(CASE WHEN outcome = 'attempt' THEN 1 ELSE 0 END) AS total_attempts
     FROM boulder_logs`
  );
  const avgRow = db.getFirstSync<{ avg_minutes: number | null }>(
    `SELECT AVG((end_time - start_time) / 60000.0) AS avg_minutes
     FROM sessions WHERE end_time IS NOT NULL`
  );
  const hardestRow = db.getFirstSync<{ grade_raw: string | null }>(
    `SELECT grade_raw FROM boulder_logs
     WHERE outcome IN ('send','flash')
     ORDER BY normalized_difficulty DESC LIMIT 1`
  );
  return {
    totalSessions: counts?.total_sessions ?? 0,
    totalSends: counts?.total_sends ?? 0,
    totalAttempts: counts?.total_attempts ?? 0,
    avgSessionMinutes: Math.round(avgRow?.avg_minutes ?? 0),
    hardestSend: hardestRow?.grade_raw ?? null,
  };
}

export interface AnalyticsOverview {
  totalSessions: number;
  totalSends: number;
  totalFlashes: number;
  totalAttempts: number;
  totalClimbs: number;
  sendRate: number;
  flashRate: number;
  attemptsPerSend: string;
  avgSessionMinutes: number;
  hardestSend: string | null;
  outcomeBreakdown: {
    flashes: number;
    sends: number;
    attempts: number;
    flashPct: number;
    sendPct: number;
    attemptPct: number;
  };
}

export function getAnalyticsOverview(sinceTimestamp?: number): AnalyticsOverview {
  const db = getDatabase();
  const timeWhere = sinceTimestamp != null ? 'WHERE timestamp >= ?' : '';
  const sessionTimeWhere = sinceTimestamp != null ? 'WHERE start_time >= ?' : '';
  const params: (number | string)[] = sinceTimestamp != null ? [sinceTimestamp] : [];

  const counts = db.getFirstSync<{
    total_sends: number;
    total_flashes: number;
    total_attempts: number;
    total_climbs: number;
  }>(
    `SELECT
       SUM(CASE WHEN outcome IN ('send','flash') THEN 1 ELSE 0 END) AS total_sends,
       SUM(CASE WHEN outcome = 'flash' THEN 1 ELSE 0 END) AS total_flashes,
       SUM(CASE WHEN outcome = 'attempt' THEN 1 ELSE 0 END) AS total_attempts,
       COUNT(*) AS total_climbs
     FROM boulder_logs ${timeWhere}`,
    params
  );

  const sessionCounts = db.getFirstSync<{ total_sessions: number; avg_minutes: number | null }>(
    `SELECT
       COUNT(*) AS total_sessions,
       AVG(CASE WHEN end_time IS NOT NULL THEN (end_time - start_time) / 60000.0 ELSE NULL END) AS avg_minutes
     FROM sessions ${sessionTimeWhere}`,
    params
  );

  const hardestRow = db.getFirstSync<{ grade_raw: string | null }>(
    `SELECT grade_raw FROM boulder_logs
     ${timeWhere ? timeWhere + " AND outcome IN ('send','flash')" : "WHERE outcome IN ('send','flash')"}
     ORDER BY normalized_difficulty DESC LIMIT 1`,
    params
  );

  const totalSends = counts?.total_sends ?? 0;
  const totalFlashes = counts?.total_flashes ?? 0;
  const totalAttempts = counts?.total_attempts ?? 0;
  const totalClimbs = counts?.total_climbs ?? 0;
  const totalSessions = sessionCounts?.total_sessions ?? 0;
  const avgSessionMinutes = Math.round(sessionCounts?.avg_minutes ?? 0);

  const sendRate = totalClimbs > 0 ? Math.round((totalSends / totalClimbs) * 100) : 0;
  const flashRate = totalSends > 0 ? Math.round((totalFlashes / totalSends) * 100) : 0;
  const attemptsPerSend = totalSends > 0 ? (totalAttempts / totalSends).toFixed(1) : '—';

  const flashPct = totalClimbs > 0 ? Math.round((totalFlashes / totalClimbs) * 100) : 0;
  const redpointSends = Math.max(0, totalSends - totalFlashes);
  const sendPct = totalClimbs > 0 ? Math.round((redpointSends / totalClimbs) * 100) : 0;
  const attemptPct = totalClimbs > 0 ? Math.max(0, 100 - flashPct - sendPct) : 0;

  return {
    totalSessions,
    totalSends,
    totalFlashes,
    totalAttempts,
    totalClimbs,
    sendRate,
    flashRate,
    attemptsPerSend,
    avgSessionMinutes,
    hardestSend: hardestRow?.grade_raw ?? null,
    outcomeBreakdown: {
      flashes: totalFlashes,
      sends: redpointSends,
      attempts: totalAttempts,
      flashPct,
      sendPct,
      attemptPct,
    },
  };
}

export interface SessionTrendPoint {
  sessionId: string;
  dateLabel: string;
  fullDate: string;
  gymName: string;
  totalClimbs: number;
  sends: number;
  attempts: number;
  hardestGrade: string | null;
  durationMinutes: number;
  avgRpe: number | null;
}

export function getRecentSessionTrends(limit = 7): SessionTrendPoint[] {
  const db = getDatabase();
  const sessionRows = db.getAllSync<{
    id: string;
    start_time: number;
    end_time: number | null;
    gym_name: string;
  }>(
    `SELECT id, start_time, end_time, gym_name FROM sessions
     ORDER BY start_time DESC LIMIT ?`,
    [limit]
  );

  return sessionRows.reverse().map((s) => {
    const logs = getLogsForSession(s.id);
    const sent = logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash');
    const attempts = logs.filter((l) => l.outcome === 'attempt');
    const hardest = [...sent].sort((a, b) => b.normalizedDifficulty - a.normalizedDifficulty)[0]?.gradeRaw ?? null;

    const d = new Date(s.start_time);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    const fullDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const durationMinutes = s.end_time ? Math.round((s.end_time - s.start_time) / 60000) : 0;

    const logsWithRpe = logs.filter((l) => l.rpe != null);
    const avgRpe =
      logsWithRpe.length > 0
        ? Math.round((logsWithRpe.reduce((acc, l) => acc + (l.rpe ?? 0), 0) / logsWithRpe.length) * 10) / 10
        : null;

    return {
      sessionId: s.id,
      dateLabel,
      fullDate,
      gymName: s.gym_name || 'Session',
      totalClimbs: logs.length,
      sends: sent.length,
      attempts: attempts.length,
      hardestGrade: hardest,
      durationMinutes,
      avgRpe,
    };
  });
}

export interface SessionSummary extends Session {
  sendCount: number;
  flashCount: number;
  gradesSent: string[];
}

export function getAllSessionSummaries(): SessionSummary[] {
  const sessions = getAllSessions();
  return sessions.map((s) => {
    const logs = getLogsForSession(s.id);
    const sent = logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash');
    const uniqueGrades = [...new Set(sent.map((l) => l.gradeRaw))]
      .sort((a, b) => parseInt(b.replace('V', ''), 10) - parseInt(a.replace('V', ''), 10))
      .slice(0, 5);
    return {
      ...s,
      sendCount: sent.length,
      flashCount: logs.filter((l) => l.outcome === 'flash').length,
      gradesSent: uniqueGrades,
    };
  });
}

export interface SessionKPIs {
  durationMs: number;
  totalSends: number;
  totalFlashes: number;
  totalAttempts: number;
  totalClimbs: number;
  hardestSend: string | null;
  flashRate: number;
  avgRpe: number | null;
}

export interface SessionDetailData {
  session: Session;
  groups: {
    id: string;
    sessionId: string;
    zoneName: string;
    order: number;
    logs: BoulderLog[];
  }[];
  pyramid: GradePyramidRow[];
  kpis: SessionKPIs;
}

export function getSessionDetail(sessionId: string): SessionDetailData | null {
  const session = getSessionById(sessionId);
  if (!session) return null;

  const rawGroups = getGroupsForSession(sessionId);
  const groups = rawGroups.map((g) => ({
    ...g,
    logs: getLogsForGroup(g.id),
  }));

  const allLogs = groups.flatMap((g) => g.logs);
  const sentLogs = allLogs.filter((l) => l.outcome === 'send' || l.outcome === 'flash');
  const flashLogs = allLogs.filter((l) => l.outcome === 'flash');
  const totalAttempts = allLogs.reduce((acc, l) => acc + l.attempts, 0);

  // Hardest send
  const sortedSends = [...sentLogs].sort((a, b) => b.normalizedDifficulty - a.normalizedDifficulty);
  const hardestSend = sortedSends.length > 0 ? sortedSends[0].gradeRaw : null;

  // Flash rate: percent of sends that were flashes
  const flashRate = sentLogs.length > 0 ? Math.round((flashLogs.length / sentLogs.length) * 100) : 0;

  // Average RPE across logged sets
  const logsWithRpe = allLogs.filter((l) => l.rpe != null);
  const avgRpe =
    logsWithRpe.length > 0
      ? Math.round((logsWithRpe.reduce((acc, l) => acc + (l.rpe ?? 0), 0) / logsWithRpe.length) * 10) / 10
      : null;

  const durationMs = (session.endTime ?? Date.now()) - session.startTime;

  const pyramid = getGradePyramid(sessionId);

  return {
    session,
    groups,
    pyramid,
    kpis: {
      durationMs,
      totalSends: sentLogs.length,
      totalFlashes: flashLogs.length,
      totalAttempts,
      totalClimbs: allLogs.length,
      hardestSend,
      flashRate,
      avgRpe,
    },
  };
}

// ─── Home Screen Stats ────────────────────────────────────────────────────────

export interface HomeStats {
  totalSessions: number;
  totalSends: number;
  totalFlashes: number;
  hardestSend: string | null;
  activeSession: { id: string; gymName: string; startTime: number } | null;
}

export function getHomeStats(): HomeStats {
  const db = getDatabase();

  const counts = db.getFirstSync<{
    total_sessions: number;
    total_sends: number;
    total_flashes: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM sessions) AS total_sessions,
       (SELECT COUNT(*) FROM boulder_logs WHERE outcome IN ('send','flash')) AS total_sends,
       (SELECT COUNT(*) FROM boulder_logs WHERE outcome = 'flash') AS total_flashes`
  );

  const hardestRow = db.getFirstSync<{ grade_raw: string | null }>(
    `SELECT grade_raw FROM boulder_logs
     WHERE outcome IN ('send','flash')
     ORDER BY normalized_difficulty DESC LIMIT 1`
  );

  const activeRow = db.getFirstSync<{
    id: string;
    gym_name: string;
    start_time: number;
  }>(
    `SELECT id, gym_name, start_time FROM sessions
     WHERE end_time IS NULL
     ORDER BY start_time DESC LIMIT 1`
  );

  return {
    totalSessions: counts?.total_sessions ?? 0,
    totalSends: counts?.total_sends ?? 0,
    totalFlashes: counts?.total_flashes ?? 0,
    hardestSend: hardestRow?.grade_raw ?? null,
    activeSession: activeRow
      ? { id: activeRow.id, gymName: activeRow.gym_name, startTime: activeRow.start_time }
      : null,
  };
}

