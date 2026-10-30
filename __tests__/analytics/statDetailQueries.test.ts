import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import * as Q from '../../db/queries';

describe('Progress Drill-Down Telemetry Queries (SQLite Integration)', () => {
  let db: any;
  const MS_HOUR = 60 * 60 * 1000;
  const MS_DAY = 24 * MS_HOUR;

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

  it('safely returns zeroed structures on an empty database with zero NaN values', () => {
    const now = new Date('2026-10-28T14:00:00Z').getTime();

    const vol = Q.getWeeklyVolumeDetail('30d', now);
    expect(vol.buckets).toEqual([]);
    expect(vol.totalClimbs).toBe(0);
    expect(vol.avgPerWeek).toBe(0);
    expect(vol.peakWeek).toBeNull();
    expect(vol.vsPrevWeekDelta).toBe(0);

    const flash = Q.getFlashEfficiencyDetail('30d', now);
    expect(flash.total).toBe(0);
    expect(flash.flashRate).toBe(0);
    expect(flash.sendRate).toBe(0);
    expect(flash.firstTryShareOfSends).toBe(0);
    expect(flash.avgBurnsToSend).toBe(0);
    expect(flash.peakFlashGradeIndex).toBeNull();
    expect(flash.flashByGrade).toEqual([]);

    const hardest = Q.getHardestSendDetail('30d', now);
    expect(hardest.peakGradeIndex).toBeNull();
    expect(hardest.allTimePeakGradeIndex).toBeNull();
    expect(hardest.isAllTimeBest).toBe(false);
    expect(hardest.peakClimb).toBeNull();
    expect(hardest.weeklyProgression).toEqual([]);

    const grade = Q.getSendsByGradeDetail('30d', now);
    expect(grade.totalUniqueSends).toBe(0);
    expect(grade.peakSendGrade).toBeNull();
    expect(grade.workhorseGrade).toBeNull();
    expect(grade.pyramidRows).toEqual([]);
  });

  it('getWeeklyVolumeDetail computes stacked outcomes, session wall time, and week-over-week delta', () => {
    // Wednesday Oct 28, 2026
    const now = new Date('2026-10-28T16:00:00Z').getTime();
    const thisTue = new Date('2026-10-27T12:00:00Z').getTime();
    const lastTue = new Date('2026-10-20T12:00:00Z').getTime();

    db.runSync(
      `INSERT INTO sessions (id, gym_name, started_at, ended_at, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?)`,
      [
        's_prev', 'Boulder Lab', lastTue, lastTue + 90 * 60 * 1000, '', now, now,
        's_curr', 'Boulder Lab', thisTue, thisTue + 60 * 60 * 1000, '', now, now,
      ]
    );

    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // Last week: 1 climb
        'c1', 's_prev', 'V4', 4, 'top', 2, lastTue + 1000, now, now,
        // This week: 3 climbs (1 flash, 1 top, 1 attempt) -> delta = +2
        'c2', 's_curr', 'V5', 5, 'flash', 1, thisTue + 1000, now, now,
        'c3', 's_curr', 'V6', 6, 'top', 3, thisTue + 2000, now, now,
        'c4', 's_curr', 'V7', 7, 'attempt', 2, thisTue + 3000, now, now,
      ]
    );

    const vol = Q.getWeeklyVolumeDetail('30d', now);
    expect(vol.totalClimbs).toBe(4);
    expect(vol.totalFlashes).toBe(1);
    expect(vol.totalTops).toBe(2);
    expect(vol.totalAttempts).toBe(1);
    expect(vol.totalSessions).toBe(2);
    expect(vol.totalMinutes).toBe(150);
    expect(vol.thisWeekClimbs).toBe(3);
    expect(vol.lastWeekClimbs).toBe(1);
    expect(vol.vsPrevWeekDelta).toBe(2);
    expect(vol.peakWeek?.totalClimbs).toBe(3);
    expect(vol.buckets.length).toBeGreaterThanOrEqual(2);
  });

  it('getFlashEfficiencyDetail computes conversion rates, burns per send, and per-grade breakdown', () => {
    const now = new Date('2026-10-28T16:00:00Z').getTime();
    Q.insertSession({ id: 's_flash', gymName: 'Crux Hall', startTime: now - MS_DAY, notes: '' });

    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'c1', 's_flash', 'V4', 4, 'flash', 1, now - 4000, now, now,
        'c2', 's_flash', 'V5', 5, 'flash', 1, now - 3000, now, now,
        'c3', 's_flash', 'V5', 5, 'top', 3, now - 2000, now, now,
        'c4', 's_flash', 'V6', 6, 'attempt', 4, now - 1000, now, now,
      ]
    );

    const flash = Q.getFlashEfficiencyDetail('30d', now);
    expect(flash.total).toBe(4);
    expect(flash.flashes).toBe(2);
    expect(flash.tops).toBe(1);
    expect(flash.attempts).toBe(1);
    expect(flash.flashRate).toBe(50);
    expect(flash.sendRate).toBe(75);
    expect(flash.firstTryShareOfSends).toBe(67); // 2 of 3 sends
    expect(flash.avgBurnsToSend).toBe(1.7); // (1 + 1 + 3) / 3 = 1.666 -> 1.7
    expect(flash.peakFlashGradeIndex).toBe(5);

    // Descending grade order: V6, V5, V4
    expect(flash.flashByGrade.map((r) => r.gradeIndex)).toEqual([6, 5, 4]);
    expect(flash.flashByGrade[1].flashRate).toBe(50); // V5: 1 flash / 2 total
  });

  it('getHardestSendDetail tracks period peak vs all-time PB and prefers Flash on tie-break', () => {
    const now = new Date('2026-10-28T16:00:00Z').getTime();
    Q.insertSession({ id: 's_old', gymName: 'Old Gym', startTime: now - 120 * MS_DAY, notes: '' });
    Q.insertSession({ id: 's_recent', gymName: 'Recent Gym', startTime: now - 2 * MS_DAY, notes: '' });

    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // V8 sent 120 days ago (all-time PB, outside 30d)
        'c_pb', 's_old', 'V8', 8, 'top', 5, now - 120 * MS_DAY, now, now,
        // V6 topped yesterday
        'c_top6', 's_recent', 'V6', 6, 'top', 2, now - MS_DAY, now, now,
        // V6 flashed 2 days ago (older, but Flash wins tie-break for crown send!)
        'c_flash6', 's_recent', 'V6', 6, 'flash', 1, now - 2 * MS_DAY, now, now,
      ]
    );

    const detail30d = Q.getHardestSendDetail('30d', now);
    expect(detail30d.peakGradeIndex).toBe(6);
    expect(detail30d.allTimePeakGradeIndex).toBe(8);
    expect(detail30d.isAllTimeBest).toBe(false);
    expect(detail30d.sendsAtPeakCount).toBe(2);
    expect(detail30d.peakClimb?.id).toBe('c_flash6');

    const detail1y = Q.getHardestSendDetail('1y', now);
    expect(detail1y.peakGradeIndex).toBe(8);
    expect(detail1y.isAllTimeBest).toBe(true);
    expect(detail1y.weeklyProgression).toHaveLength(2);
  });

  it('getSendsByGradeDetail enforces single-count pyramid rule while tracking repeats, attempts, and project titles', () => {
    const now = new Date('2026-10-28T16:00:00Z').getTime();

    Q.insertProject({
      id: 'proj_v6',
      title: 'Midnight Lightning',
      gradeRaw: 'V6',
      normalizedDifficulty: 6,
      wallAngle: 'overhang',
      holdType: 'crimps',
      status: 'in_progress',
      highWaterMarkMoves: 0,
      totalMoves: 8,
      microBeta: null,
      mediaUri: null,
    });

    Q.insertSession({ id: 's_pyr2', gymName: 'Arch Climbing', startTime: now - MS_DAY, notes: '' });

    db.runSync(
      `INSERT INTO climbs (id, session_id, project_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // Project sent twice (1st flash, 2nd repeat top) -> 1 unique flash + 1 repeat
        'c1', 's_pyr2', 'proj_v6', 'V6', 6, 'flash', 1, now - 4000, now, now,
        'c2', 's_pyr2', 'proj_v6', 'V6', 6, 'top', 1, now - 3000, now, now,
        // Quick log V4 top
        'c3', 's_pyr2', null, 'V4', 4, 'top', 2, now - 2000, now, now,
        // V7 un-sent attempt
        'c4', 's_pyr2', null, 'V7', 7, 'attempt', 3, now - 1000, now, now,
      ]
    );

    const detail = Q.getSendsByGradeDetail('30d', now);
    expect(detail.totalUniqueSends).toBe(2); // V6 flash + V4 top
    expect(detail.totalUniqueFlashes).toBe(1);
    expect(detail.totalUniqueTops).toBe(1);
    expect(detail.totalRepeatSends).toBe(1);
    expect(detail.totalAttempts).toBe(1);
    expect(detail.peakSendGrade).toBe(6); // V7 was only attempted, not sent
    expect(detail.bandCounts.intermediate).toBe(1); // V4
    expect(detail.bandCounts.advanced).toBe(1); // V6

    const v6Row = detail.pyramidRows.find((r) => r.gradeIndex === 6);
    expect(v6Row?.uniqueSends).toBe(1);
    expect(v6Row?.repeatSends).toBe(1);

    const linkedClimb = detail.climbs.find((c) => c.id === 'c1');
    expect(linkedClimb?.projectTitle).toBe('Midnight Lightning');
  });
});
