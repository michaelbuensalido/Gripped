import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  buildGradePyramid,
  calculateSendRate,
  calculateFlashRate,
  calculateAverageGradeLast20,
  getMondayMidnight,
  calculateWeeklyStreak,
} from '../../utils/analyticsLogic';
import { getDatabase } from '../../db/schema';
import * as Q from '../../db/queries';

describe('Analytics Rules & Pure Mathematics', () => {
  describe('1. Pyramid Single-Count vs Volume Rule', () => {
    it('counts repeat sends of a project only once on the pyramid, while all count toward volume', () => {
      const now = Date.now();
      const climbs = [
        // Project P1: first send at 10:00 (Flash, V5)
        { id: 'c1', projectId: 'proj-1', gradeIndex: 5, result: 'flash', loggedAt: now - 3000 },
        // Project P1: repeat send at 10:30 (Send, V5)
        { id: 'c2', projectId: 'proj-1', gradeIndex: 5, result: 'send', loggedAt: now - 2000 },
        // Project P1: third send at 11:00 (Send, V5)
        { id: 'c3', projectId: 'proj-1', gradeIndex: 5, result: 'send', loggedAt: now - 1000 },
        // Quick log: V5 send without project
        { id: 'c4', projectId: null, gradeIndex: 5, result: 'send', loggedAt: now - 500 },
        // Project P2: V7 flash
        { id: 'c5', projectId: 'proj-2', gradeIndex: 7, result: 'flash', loggedAt: now - 400 },
      ];

      const pyramid = buildGradePyramid(climbs);

      // Volume = 5 total climbs
      expect(climbs.length).toBe(5);

      // Pyramid: P1 counts once (flash), quick log counts once (send) -> V5 has 1 flash + 1 send = 2
      // V7 has 1 flash
      const v5Row = pyramid.find((r) => r.grade === 5);
      const v7Row = pyramid.find((r) => r.grade === 7);

      expect(v5Row).toBeDefined();
      expect(v5Row?.flashes).toBe(1);
      expect(v5Row?.sends).toBe(1); // 1 repeat excluded

      expect(v7Row).toBeDefined();
      expect(v7Row?.flashes).toBe(1);
      expect(v7Row?.sends).toBe(0);
    });

    it('ignores attempts on the pyramid but keeps them in volume', () => {
      const now = Date.now();
      const climbs = [
        { id: 'c1', projectId: 'proj-1', gradeIndex: 6, result: 'attempt', loggedAt: now - 2000 },
        { id: 'c2', projectId: 'proj-1', gradeIndex: 6, result: 'attempt', loggedAt: now - 1000 },
      ];

      const pyramid = buildGradePyramid(climbs);
      expect(climbs.length).toBe(2); // Volume counts attempts
      expect(pyramid.length).toBe(0); // Pyramid has 0 sends
    });
  });

  describe('2. Send Rate and Flash Rate', () => {
    it('returns 0% for empty data without division by zero', () => {
      expect(calculateSendRate(0, 0, 0)).toBe(0);
      expect(calculateFlashRate(0, 0)).toBe(0);
      expect(calculateSendRate(0, 0, -5)).toBe(0);
    });

    it('calculates 100% send rate when all climbs are sends or flashes', () => {
      expect(calculateSendRate(2, 3, 5)).toBe(100);
      expect(calculateFlashRate(5, 5)).toBe(100);
    });

    it('correctly rounds percentage for mixed results', () => {
      // 1 flash, 1 send out of 3 total = 66.67% -> 67%
      expect(calculateSendRate(1, 1, 3)).toBe(67);
      // 1 flash out of 3 total = 33.33% -> 33%
      expect(calculateFlashRate(1, 3)).toBe(33);
    });
  });

  describe('3. Last-20 Average Grade', () => {
    it('returns 0 when no grades exist', () => {
      expect(calculateAverageGradeLast20([])).toBe(0);
    });

    it('calculates mean of last 20 sends, rounding correctly', () => {
      // 20 grades: ten V4s, ten V5s -> mean = 4.5 -> rounds to 5
      const grades = [
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      ];
      expect(calculateAverageGradeLast20(grades)).toBe(5);
    });

    it('limits to the first 20 items in chronological slice', () => {
      // 20 V6s followed by 10 V1s
      const grades = [
        ...Array(20).fill(6),
        ...Array(10).fill(1),
      ];
      expect(calculateAverageGradeLast20(grades)).toBe(6);
    });
  });

  describe('4. Weekly Streak (Monday to Sunday)', () => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_WEEK = 7 * MS_PER_DAY;

    it('returns 0 for no sessions', () => {
      expect(calculateWeeklyStreak([])).toBe(0);
    });

    it('calculates streak 1 for session in current week', () => {
      const now = new Date('2026-10-14T12:00:00Z').getTime(); // Wednesday
      const sessionTime = new Date('2026-10-13T10:00:00Z').getTime(); // Tuesday
      expect(calculateWeeklyStreak([sessionTime], now)).toBe(1);
    });

    it('does not double count multiple sessions in the same week', () => {
      const now = new Date('2026-10-14T12:00:00Z').getTime();
      const s1 = new Date('2026-10-12T10:00:00Z').getTime(); // Monday
      const s2 = new Date('2026-10-13T10:00:00Z').getTime(); // Tuesday
      const s3 = new Date('2026-10-14T10:00:00Z').getTime(); // Wednesday
      expect(calculateWeeklyStreak([s1, s2, s3], now)).toBe(1);
    });

    it('preserves active streak when current week is in progress and last week had a session', () => {
      const now = new Date('2026-10-14T12:00:00Z').getTime(); // Wednesday, no session yet this week
      const lastWeekSession = new Date('2026-10-08T10:00:00Z').getTime(); // Previous Thursday
      expect(calculateWeeklyStreak([lastWeekSession], now)).toBe(1);
    });

    it('increments streak for consecutive weeks', () => {
      const now = new Date('2026-10-14T12:00:00Z').getTime(); // Week 3
      const s3 = new Date('2026-10-13T10:00:00Z').getTime(); // Week 3
      const s2 = new Date('2026-10-06T10:00:00Z').getTime(); // Week 2
      const s1 = new Date('2026-09-29T10:00:00Z').getTime(); // Week 1
      expect(calculateWeeklyStreak([s3, s2, s1], now)).toBe(3);
    });

    it('breaks streak when a week is missed', () => {
      const now = new Date('2026-10-14T12:00:00Z').getTime(); // Week 4
      const sCurrent = new Date('2026-10-13T10:00:00Z').getTime(); // Week 4
      // Missed week 3
      const sOld = new Date('2026-09-29T10:00:00Z').getTime(); // Week 2
      expect(calculateWeeklyStreak([sCurrent, sOld], now)).toBe(1);
    });

    it('correctly spans year boundary (Dec 29 to Jan 5)', () => {
      // Dec 29, 2025 is Monday
      // Jan 05, 2026 is Monday
      const dec29 = new Date('2025-12-30T10:00:00Z').getTime(); // Week 52 of 2025
      const jan05 = new Date('2026-01-06T10:00:00Z').getTime(); // Week 1 of 2026
      const now = new Date('2026-01-07T12:00:00Z').getTime(); // Jan 7, 2026
      expect(calculateWeeklyStreak([jan05, dec29], now)).toBe(2);
    });
  });
});

describe('Analytics Database Queries (SQLite Integration)', () => {
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

  it('getGradePyramid enforces single-send project rule in SQLite', () => {
    const now = Date.now();
    Q.insertProject({
      id: 'p_pyramid',
      title: 'Pyramid Project',
      gradeRaw: 'V6',
      normalizedDifficulty: 6,
      wallAngle: 'overhang',
      holdType: 'crimps',
      status: 'in_progress',
      highWaterMarkMoves: 0,
      totalMoves: 10,
      microBeta: null,
      mediaUri: null,
    });

    Q.insertSession({
      id: 's_pyr',
      gymName: 'Pyramid Gym',
      startTime: now - 3600000,
      notes: '',
    });

    // Insert 3 sends for p_pyramid in the same session/period
    db.runSync(
      `INSERT INTO climbs (id, session_id, project_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'c1', 's_pyr', 'p_pyramid', 'V6', 6, 'flash', 1, now - 3000, now, now,
        'c2', 's_pyr', 'p_pyramid', 'V6', 6, 'top', 1, now - 2000, now, now,
        'c3', 's_pyr', 'p_pyramid', 'V6', 6, 'top', 1, now - 1000, now, now,
      ]
    );

    const pyramid = Q.getGradePyramid('30d', now);
    expect(pyramid).toHaveLength(1);
    expect(pyramid[0].grade).toBe(6);
    expect(pyramid[0].flashes).toBe(1);
    expect(pyramid[0].sends).toBe(0); // Repeats excluded from pyramid

    // All 3 climbs still count in volume query
    const resultCounts = Q.getResultCounts('30d', now);
    expect(resultCounts.flash).toBe(1);
    expect(resultCounts.top).toBe(2);
    expect(resultCounts.flash + resultCounts.top).toBe(3);
  });

  it('getHardestSend returns peak grade index sent in timeframe', () => {
    const now = Date.now();
    Q.insertSession({ id: 's_hard', gymName: 'Hard Gym', startTime: now, notes: '' });

    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'c1', 's_hard', 'V3', 3, 'top', 1, now - 2000, now, now,
        'c2', 's_hard', 'V8', 8, 'top', 3, now - 1000, now, now,
      ]
    );

    expect(Q.getHardestSend('30d', now)).toBe(8);
    expect(Q.getHardestSend('7d', now - 1000000000)).toBeNull();
  });

  it('getClimbsForGrade returns only matching grade climbs for drilldown', () => {
    const now = Date.now();
    Q.insertSession({ id: 's_drill', gymName: 'Drill Gym', startTime: now, notes: '' });

    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'c1', 's_drill', 'V4', 4, 'flash', 1, now - 3000, now, now,
        'c2', 's_drill', 'V5', 5, 'top', 2, now - 2000, now, now,
        'c3', 's_drill', 'V4', 4, 'attempt', 1, now - 1000, now, now,
      ]
    );

    const v4Climbs = Q.getClimbsForGrade('30d', 4, now);
    expect(v4Climbs).toHaveLength(2);
    expect(v4Climbs.map((c) => c.id)).toEqual(['c3', 'c1']); // Order DESC by loggedAt

    const v5Climbs = Q.getClimbsForGrade('30d', 5, now);
    expect(v5Climbs).toHaveLength(1);
    expect(v5Climbs[0].id).toBe('c2');
  });

  it('all 5 timeframes (7d, 30d, 90d, 1y, all) filter appropriately', () => {
    const now = Date.now();
    const MS_DAY = 86400000;
    Q.insertSession({ id: 's_time', gymName: 'Time Gym', startTime: now, notes: '' });

    // c1: 2 days ago (within 7d, 30d, 90d, 1y, all)
    // c2: 15 days ago (within 30d, 90d, 1y, all)
    // c3: 45 days ago (within 90d, 1y, all)
    // c4: 120 days ago (within 1y, all)
    // c5: 400 days ago (within all only)
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'c1', 's_time', 'V4', 4, 'top', 1, now - 2 * MS_DAY, now, now,
        'c2', 's_time', 'V4', 4, 'top', 1, now - 15 * MS_DAY, now, now,
        'c3', 's_time', 'V4', 4, 'top', 1, now - 45 * MS_DAY, now, now,
        'c4', 's_time', 'V4', 4, 'top', 1, now - 120 * MS_DAY, now, now,
        'c5', 's_time', 'V4', 4, 'top', 1, now - 400 * MS_DAY, now, now,
      ]
    );

    expect(Q.getResultCounts('7d', now).top).toBe(1);
    expect(Q.getResultCounts('30d', now).top).toBe(2);
    expect(Q.getResultCounts('90d', now).top).toBe(3);
    expect(Q.getResultCounts('1y', now).top).toBe(4);
    expect(Q.getResultCounts('all', now).top).toBe(5);
  });
});
