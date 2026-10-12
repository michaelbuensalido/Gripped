/**
 * Performance script that seeds 2,500 climbs across 80 sessions
 * and benchmarks the screen load time for Analytics.
 */
import { getDatabase } from '../db/schema';
import * as Q from '../db/queries';

export function runAnalyticsBenchmark() {
  const db = getDatabase();
  const now = Date.now();
  const MS_DAY = 86400000;

  console.log('Seeding 2,500 climbs across 80 sessions...');
  db.execSync(`
    DELETE FROM video_notes;
    DELETE FROM beta_videos;
    DELETE FROM beta_moves;
    DELETE FROM betas;
    DELETE FROM outbox;
    DELETE FROM climbs;
    DELETE FROM sessions;
    DELETE FROM projects;
  `);

  for (let p = 0; p < 20; p++) {
    db.runSync(
      `INSERT INTO projects (id, title, grade_raw, grade_index, wall_angle, hold_type, status, high_water_mark_moves, total_moves, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`proj_${p}`, `Project ${p}`, `V${(p % 10) + 1}`, (p % 10) + 1, 'overhang', 'crimps', 'in_progress', 3, 10, now - 60 * MS_DAY, now - 60 * MS_DAY]
    );
  }

  for (let s = 0; s < 80; s++) {
    const sessionStart = now - (80 - s) * 2 * MS_DAY;
    const sessionEnd = sessionStart + 7200000;
    db.runSync(
      `INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`sess_${s}`, `Gym ${(s % 4) + 1}`, sessionStart, sessionEnd, sessionStart, sessionStart]
    );
  }

  const results = ['flash', 'top', 'top', 'attempt', 'attempt'];
  const angles = ['slab', 'vertical', 'overhang', 'roof'];
  const holds = ['crimps', 'slopers', 'pinches', 'jugs', 'pockets'];

  db.execSync('BEGIN TRANSACTION;');
  for (let c = 0; c < 2500; c++) {
    const sessionId = `sess_${c % 80}`;
    const sessionTime = now - (80 - (c % 80)) * 2 * MS_DAY + (c % 50) * 60000;
    const projectId = c % 4 === 0 ? `proj_${c % 20}` : null;
    const gradeIndex = (c % 11) + 1;
    const result = results[c % results.length];
    const attempts = result === 'flash' ? 1 : (c % 4) + 1;
    const angle = angles[c % angles.length];
    const hold = holds[c % holds.length];

    db.runSync(
      `INSERT INTO climbs (id, session_id, project_id, grade_raw, grade_index, result, attempts, wall_angle, hold_type, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`climb_${c}`, sessionId, projectId, `V${gradeIndex}`, gradeIndex, result, attempts, angle, hold, sessionTime, sessionTime, sessionTime]
    );
  }
  db.execSync('COMMIT;');

  console.log('Seeding complete. Benchmarking queries...');
  const t0 = Date.now();

  Q.getResultCounts('30d', now);
  Q.getAverageGradeLast20();
  Q.getGradePyramid('30d', now);
  Q.getWeeklyVolume('30d', now);
  Q.getRates('30d', now);
  Q.getHardestSendTrend('30d', now);
  Q.getHardestSend('30d', now);
  Q.getStreak(now);
  Q.getWallAngleSendRates('30d', now);
  Q.getFailureReasonCounts('30d', now);
  Q.getSessionPeriodStats('30d', now);

  const t1 = Date.now();
  const elapsed = t1 - t0;
  console.log(`[BENCHMARK RESULT] Aggregated 2,500 climbs in ${elapsed}ms.`);
  return elapsed;
}

if (require.main === module) {
  runAnalyticsBenchmark();
}
