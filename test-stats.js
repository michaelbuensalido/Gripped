const assert = require('assert');
const Database = require('better-sqlite3');

// Create an in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE climbs (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    project_id TEXT,
    grade_index INTEGER,
    result TEXT,
    logged_at INTEGER,
    deleted_at INTEGER
  );
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    started_at INTEGER,
    deleted_at INTEGER
  );
`);

// MOCK the getDatabase function to return our better-sqlite3 wrapper
const getDatabase = () => ({
  getAllSync: (sql, args = []) => db.prepare(sql).all(...args),
  getFirstSync: (sql, args = []) => db.prepare(sql).get(...args),
});

const now = 1700000000000;

// --- Stats Logic Copied/Adapted from db/queries.ts ---
function getResultCounts(period, nowMs) {
  const rows = getDatabase().getAllSync(`
    SELECT result, COUNT(*) as count 
    FROM climbs 
    WHERE deleted_at IS NULL
    GROUP BY result
  `);
  let flash = 0, top = 0, attempt = 0;
  for (const row of rows) {
    if (row.result === 'flash') flash += row.count;
    else if (row.result === 'send' || row.result === 'top') top += row.count;
    else attempt += row.count;
  }
  return { flash, top, attempt };
}

function getAverageGradeLast20() {
  const rows = getDatabase().getAllSync(`
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

function getGradePyramid(period, nowMs) {
  const rows = getDatabase().getAllSync(`
    SELECT grade_index, result, COUNT(*) as count
    FROM (
      SELECT grade_index, result, 
             ROW_NUMBER() OVER(PARTITION BY COALESCE(project_id, id) ORDER BY logged_at ASC) as rn
      FROM climbs
      WHERE deleted_at IS NULL AND (result = 'send' OR result = 'top' OR result = 'flash')
    )
    WHERE rn = 1
    GROUP BY grade_index, result
  `);
  const grades = new Map();
  for (const row of rows) {
    if (!grades.has(row.grade_index)) grades.set(row.grade_index, { grade: row.grade_index, flashes: 0, sends: 0 });
    const stat = grades.get(row.grade_index);
    if (row.result === 'flash') stat.flashes += row.count;
    else stat.sends += row.count;
  }
  return Array.from(grades.values()).sort((a, b) => b.grade - a.grade);
}

function getWeeklyVolume(period, nowMs) {
  return getDatabase().getAllSync(`
    SELECT strftime('%Y-%W', datetime(logged_at / 1000, 'unixepoch', 'localtime')) as week, 
           COUNT(*) as count
    FROM climbs
    WHERE deleted_at IS NULL
    GROUP BY week
    ORDER BY week ASC
  `);
}

function getStreak(nowMs) {
  const rows = getDatabase().getAllSync(`
    SELECT DISTINCT strftime('%Y-%W', datetime(started_at / 1000, 'unixepoch', 'localtime')) as week
    FROM sessions
    WHERE deleted_at IS NULL
    ORDER BY week DESC
  `);
  if (rows.length === 0) return 0;
  
  const parseWeek = (yW) => {
    const [y, w] = yW.split('-');
    return parseInt(y) * 52 + parseInt(w);
  };
  
  const currentRow = getDatabase().getFirstSync(`SELECT strftime('%Y-%W', datetime(?, 'unixepoch', 'localtime')) as week`, [Math.floor(nowMs/1000)]);
  const lastWeekVal = parseWeek(rows[0].week);
  const currentWeekVal = currentRow ? parseWeek(currentRow.week) : 0;
  
  if (currentWeekVal - lastWeekVal > 1) return 0;
  
  let streak = 1;
  let prevVal = lastWeekVal;
  for (let i = 1; i < rows.length; i++) {
    const val = parseWeek(rows[i].week);
    if (prevVal - val === 1) {
      streak++;
      prevVal = val;
    } else break;
  }
  return streak;
}

// --- RUN TESTS ---
console.log("Running Stats Unit Tests...");

// 1. Edge Case: No data
assert.deepStrictEqual(getResultCounts('all', now), { flash: 0, top: 0, attempt: 0 });
assert.strictEqual(getAverageGradeLast20(), 0);
assert.deepStrictEqual(getGradePyramid('all', now), []);
assert.deepStrictEqual(getWeeklyVolume('all', now), []);
assert.strictEqual(getStreak(now), 0);
console.log("✅ Passed: No data");

// 2. Edge Case: Soft-deleted climbs are ignored
db.exec(`INSERT INTO climbs (id, grade_index, result, logged_at, deleted_at) VALUES ('del1', 4, 'send', ${now}, ${now})`);
assert.strictEqual(getResultCounts('all', now).top, 0);
console.log("✅ Passed: Soft-deleted climbs ignored");

// 3. Edge Case: Single climb counts correctly
db.exec(`INSERT INTO climbs (id, grade_index, result, logged_at) VALUES ('c1', 4, 'flash', ${now})`);
assert.strictEqual(getResultCounts('all', now).flash, 1);
assert.strictEqual(getAverageGradeLast20(), 4);
console.log("✅ Passed: Single climb");

// 4. Edge Case: Repeated sends of one problem (pyramid vs volume)
db.exec(`DELETE FROM climbs`); // reset
db.exec(`INSERT INTO climbs (id, project_id, grade_index, result, logged_at) VALUES ('c1', 'p1', 5, 'send', ${now-2000})`);
db.exec(`INSERT INTO climbs (id, project_id, grade_index, result, logged_at) VALUES ('c2', 'p1', 5, 'send', ${now-1000})`);
db.exec(`INSERT INTO climbs (id, project_id, grade_index, result, logged_at) VALUES ('c3', 'p1', 5, 'attempt', ${now})`);

const pyramid = getGradePyramid('all', now);
assert.strictEqual(pyramid.length, 1);
assert.strictEqual(pyramid[0].sends, 1, "Pyramid should count multiple sends of same project as 1");

const volume = getWeeklyVolume('all', now);
assert.strictEqual(volume[0].count, 3, "Volume should count all climbs (including repeats/attempts)");
console.log("✅ Passed: Repeated sends handling (Pyramid vs Volume)");

// 5. Edge Case: Streak across a year boundary
db.exec(`DELETE FROM sessions`); // reset
// 2023-12-31 12:00:00Z -> 1704024000000 (Sunday)
// 2024-01-01 12:00:00Z -> 1704110400000 (Monday)
const sun23 = 1704024000000;
const mon24 = 1704110400000;
db.exec(`INSERT INTO sessions (id, started_at) VALUES ('s1', ${sun23})`);
db.exec(`INSERT INTO sessions (id, started_at) VALUES ('s2', ${mon24})`);
const streak = getStreak(mon24);
assert.strictEqual(streak, 2, "Streak should handle week transitions across year boundaries");
console.log("✅ Passed: Streak across year boundary");

console.log("ALL UNIT TESTS PASSED.");
