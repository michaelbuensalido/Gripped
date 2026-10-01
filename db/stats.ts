import { getDatabase } from './schema';

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
