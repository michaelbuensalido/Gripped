/**
 * Pure business logic and mathematical rules for CruxLog Analytics.
 * Documented rules tested in unit tests.
 */

export interface PyramidClimbInput {
  id: string;
  projectId?: string | null;
  gradeIndex: number;
  result: string;
  loggedAt: number;
}

export interface GradePyramidRow {
  grade: number;
  flashes: number;
  sends: number; // sends excluding flashes
}

/**
 * 1. Pyramid Single-Count Rule:
 * A problem sent multiple times counts once in the pyramid (first send within period).
 * Quick logs (projectId is null or undefined) each count as distinct sends.
 * All attempts and repeats still count toward volume.
 */
export function buildGradePyramid(climbs: PyramidClimbInput[]): GradePyramidRow[] {
  // Filter for sends only (flash, send, top)
  const sends = climbs.filter(
    (c) => c.result === 'flash' || c.result === 'send' || c.result === 'top'
  );

  // Group by project if present, picking the earliest logged send
  const seenProjects = new Set<string>();
  const qualifyingClimbs: PyramidClimbInput[] = [];

  // Sort by loggedAt ascending so first send takes precedence
  const sortedSends = [...sends].sort((a, b) => a.loggedAt - b.loggedAt);

  for (const c of sortedSends) {
    if (c.projectId) {
      if (!seenProjects.has(c.projectId)) {
        seenProjects.add(c.projectId);
        qualifyingClimbs.push(c);
      }
    } else {
      qualifyingClimbs.push(c);
    }
  }

  const map = new Map<number, { grade: number; flashes: number; sends: number }>();
  for (const c of qualifyingClimbs) {
    if (!map.has(c.gradeIndex)) {
      map.set(c.gradeIndex, { grade: c.gradeIndex, flashes: 0, sends: 0 });
    }
    const item = map.get(c.gradeIndex)!;
    if (c.result === 'flash') {
      item.flashes++;
    } else {
      item.sends++;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.grade - a.grade);
}

/**
 * 2. Send Rate Calculation:
 * Round((sends + flashes) / total * 100)
 * Safely returns 0 when total is 0.
 */
export function calculateSendRate(flashes: number, tops: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round(((flashes + tops) / total) * 100);
}

/**
 * 3. Flash Rate Calculation:
 * Round(flashes / total * 100)
 * Safely returns 0 when total is 0.
 */
export function calculateFlashRate(flashes: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((flashes / total) * 100);
}

/**
 * 4. Average Grade of Last 20 Routes:
 * Average gradeIndex of last 20 sends/flashes, rounded to nearest integer.
 */
export function calculateAverageGradeLast20(grades: number[]): number {
  if (!grades || grades.length === 0) return 0;
  const slice = grades.slice(0, 20);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Math.round(sum / slice.length);
}

/**
 * 5. Monday Midnight Timestamp:
 * Converts timestamp to Monday 00:00:00.000 local time.
 */
export function getMondayMidnight(timeMs: number): number {
  const d = new Date(timeMs);
  const day = d.getDay(); // 0 is Sunday, 1..6 is Mon..Sat
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * 6. Weekly Streak Calculation (Monday to Sunday):
 * Consecutive weeks with >= 1 session.
 * Handles month/year boundaries, ongoing current week, and breaks.
 */
export function calculateWeeklyStreak(sessionTimestamps: number[], nowMs: number = Date.now()): number {
  if (!sessionTimestamps || sessionTimestamps.length === 0) return 0;

  const currentMonday = getMondayMidnight(nowMs);
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  // Extract unique Monday midnights sorted descending
  const mondays = Array.from(
    new Set(sessionTimestamps.map((ts) => getMondayMidnight(ts)))
  ).sort((a, b) => b - a);

  if (mondays.length === 0) return 0;

  const latestMonday = mondays[0];
  const diffWeeks = Math.round((currentMonday - latestMonday) / MS_PER_WEEK);

  // If latest session is older than last week, streak is 0
  if (diffWeeks > 1) {
    return 0;
  }

  let streak = 1;
  let prevMonday = latestMonday;

  for (let i = 1; i < mondays.length; i++) {
    const m = mondays[i];
    const diff = Math.round((prevMonday - m) / MS_PER_WEEK);
    if (diff === 1) {
      streak++;
      prevMonday = m;
    } else {
      break;
    }
  }

  return streak;
}
