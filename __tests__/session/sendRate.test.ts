import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import * as Q from '../../db/queries';
import { isSend } from '../../utils/isSend';

describe('Send-Rate Mathematics', () => {
  let db: any;

  beforeEach(() => {
    db = getDatabase();
    db.execSync(`
      DELETE FROM outbox;
      DELETE FROM climbs;
      DELETE FROM sessions;
    `);
  });

  it('calculates 0% send rate when 0 climbs exist without division by zero', () => {
    const sessionId = 'session_empty_rate';
    Q.insertSession({
      id: sessionId,
      gymName: 'Empty Gym',
      startTime: Date.now(),
      notes: '',
    });

    const activeClimbs = Q.getClimbsForSession(sessionId);
    const sends = activeClimbs.filter((c: any) => isSend(c.result));
    const sendRate = activeClimbs.length > 0
      ? Math.round((sends.length / activeClimbs.length) * 100)
      : 0;

    expect(activeClimbs.length).toBe(0);
    expect(sendRate).toBe(0);
    expect(Number.isNaN(sendRate)).toBe(false);
  });

  it('calculates 100% send rate when all climbs are sends and flashes', () => {
    const sessionId = 'session_perfect_rate';
    Q.insertSession({
      id: sessionId,
      gymName: 'Send Gym',
      startTime: Date.now(),
      notes: '',
    });

    const now = Date.now();
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['c1', sessionId, 'V3', 3, 'flash', 1, now, now, now,
       'c2', sessionId, 'V4', 4, 'top', 2, now, now, now]
    );

    const activeClimbs = Q.getClimbsForSession(sessionId);
    const sends = activeClimbs.filter((c: any) => isSend(c.result));
    const sendRate = activeClimbs.length > 0
      ? Math.round((sends.length / activeClimbs.length) * 100)
      : 0;

    expect(activeClimbs.length).toBe(2);
    expect(sends.length).toBe(2);
    expect(sendRate).toBe(100);
  });

  it('correctly rounds send rate for mixed climb results', () => {
    const sessionId = 'session_mixed_rate';
    Q.insertSession({
      id: sessionId,
      gymName: 'Mixed Gym',
      startTime: Date.now(),
      notes: '',
    });

    const now = Date.now();
    // 1 flash, 1 send, 1 attempt = 2 sends out of 3 = 66.66% -> 67%
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['c1', sessionId, 'V3', 3, 'flash', 1, now, now, now,
       'c2', sessionId, 'V4', 4, 'top', 2, now, now, now,
       'c3', sessionId, 'V5', 5, 'attempt', 3, now, now, now]
    );

    const activeClimbs = Q.getClimbsForSession(sessionId);
    const sends = activeClimbs.filter((c: any) => isSend(c.result));
    const sendRate = Math.round((sends.length / activeClimbs.length) * 100);

    expect(activeClimbs.length).toBe(3);
    expect(sends.length).toBe(2);
    expect(sendRate).toBe(67);
  });

  it('excludes soft-deleted climbs from send rate calculation', () => {
    const sessionId = 'session_deleted_rate';
    Q.insertSession({
      id: sessionId,
      gymName: 'Soft Delete Gym',
      startTime: Date.now(),
      notes: '',
    });

    const now = Date.now();
    // 1 send, 1 attempt (deleted), 1 attempt (active)
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['c1', sessionId, 'V3', 3, 'top', 1, now, now, now, null,
       'c2', sessionId, 'V4', 4, 'attempt', 1, now, now, now, now, // deleted!
       'c3', sessionId, 'V5', 5, 'attempt', 1, now, now, now, null]
    );

    const activeClimbs = Q.getClimbsForSession(sessionId);
    const sends = activeClimbs.filter((c: any) => isSend(c.result));
    const sendRate = Math.round((sends.length / activeClimbs.length) * 100);

    expect(activeClimbs.length).toBe(2);
    expect(sends.length).toBe(1);
    expect(sendRate).toBe(50); // 1 / 2 = 50%
  });

  it('computes wall angle send rates accurately', () => {
    const sessionId = 'session_wall_angle';
    Q.insertSession({
      id: sessionId,
      gymName: 'Angle Gym',
      startTime: Date.now(),
      notes: '',
    });

    const now = Date.now();
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, wall_angle, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['c1', sessionId, 'V3', 3, 'top', 1, 'slab', now, now, now,
       'c2', sessionId, 'V4', 4, 'attempt', 1, 'slab', now, now, now,
       'c3', sessionId, 'V5', 5, 'top', 1, 'roof', now, now, now]
    );

    const rates = Q.getWallAngleSendRates('all', now);
    expect(rates.hasData).toBe(true);
    expect(rates.slab).toBe(50); // 1 send out of 2 = 50%
    expect(rates.roof).toBe(100); // 1 send out of 1 = 100%
    expect(rates.vertical).toBe(0);
    expect(rates.overhang).toBe(0);
  });
});
