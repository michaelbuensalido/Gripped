import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import * as Q from '../../db/queries';

describe('Analytics Scale Performance (2,000+ Climbs)', () => {
  let db: any;

  beforeEach(() => {
    db = getDatabase();
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
  });

  it('executes the full analytics calculation suite across 2,500 climbs in under 50ms', () => {
    const now = Date.now();
    const MS_DAY = 86400000;

    // 1. Seed 20 projects
    for (let p = 0; p < 20; p++) {
      db.runSync(
        `INSERT INTO projects (id, title, grade_raw, grade_index, wall_angle, hold_type, status, high_water_mark_moves, total_moves, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`proj_${p}`, `Project ${p}`, `V${(p % 10) + 1}`, (p % 10) + 1, 'overhang', 'crimps', 'in_progress', 3, 10, now - 60 * MS_DAY, now - 60 * MS_DAY]
      );
    }

    // 2. Seed 80 sessions spanning the last 160 days
    for (let s = 0; s < 80; s++) {
      const sessionStart = now - (80 - s) * 2 * MS_DAY;
      const sessionEnd = sessionStart + 7200000; // 2 hours
      db.runSync(
        `INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`sess_${s}`, `Gym ${(s % 4) + 1}`, sessionStart, sessionEnd, sessionStart, sessionStart]
      );
    }

    // 3. Batch insert 2,500 climbs in transactions for fast seeding
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

    const totalClimbs = db.getFirstSync(`SELECT COUNT(*) as count FROM climbs`).count;
    expect(totalClimbs).toBe(2500);

    // 4. Benchmark all analytics queries in sequence (simulating a screen load)
    const startTime = performance.now();

    const resultCounts = Q.getResultCounts('30d', now);
    const avgGrade = Q.getAverageGradeLast20();
    const pyramid = Q.getGradePyramid('30d', now);
    const volume = Q.getWeeklyVolume('30d', now);
    const rates = Q.getRates('30d', now);
    const hardestTrend = Q.getHardestSendTrend('30d', now);
    const hardestPeak = Q.getHardestSend('30d', now);
    const streak = Q.getStreak(now);
    const wallRates = Q.getWallAngleSendRates('30d', now);
    const failures = Q.getFailureReasonCounts('30d', now);
    const sessionStats = Q.getSessionPeriodStats('30d', now);

    const endTime = performance.now();
    const durationMs = endTime - startTime;

    // Verify correct calculations
    expect(resultCounts.flash).toBeGreaterThan(0);
    expect(avgGrade).toBeGreaterThan(0);
    expect(pyramid.length).toBeGreaterThan(0);
    expect(volume.length).toBeGreaterThan(0);
    expect(rates.flashRate).toBeGreaterThan(0);
    expect(hardestPeak).toBeGreaterThan(0);
    expect(streak).toBeGreaterThan(0);
    expect(wallRates.hasData).toBe(true);
    expect(sessionStats.sessions).toBeGreaterThan(0);

    // Assert load performance: < 50ms for 2,500 climbs
    console.log(`[PERF BENCHMARK] Full analytics query suite on 2,500 climbs completed in: ${durationMs.toFixed(2)}ms`);
    expect(durationMs).toBeLessThan(50);
  });
});
