import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import {
  insertSession,
  insertBoulderLog,
  softDeleteBoulderLog,
  undoDeleteBoulderLog,
  getSessionSummary,
  softDeleteSession,
  undoDeleteSession,
} from '../../db/queries';

let idCounter = 0;
jest.mock('uuid', () => ({ v4: () => `test-uuid-summary-${idCounter++}` }));

describe('getSessionSummary and session aggregates', () => {
  let db: any;

  beforeEach(() => {
    db = getDatabase();
    db.execSync(`
      DELETE FROM outbox;
      DELETE FROM climbs;
      DELETE FROM sessions;
      DELETE FROM projects;
    `);
  });

  it('calculates aggregates and correctly ignores soft-deleted climbs', () => {
    const sessionId = 'session_test_summary';
    insertSession({
      id: sessionId,
      gymName: 'The Boulder Yard',
      startTime: 1000,
      notes: 'Fun day',
      title: 'Session 1',
      rpe: 4,
      mediaUris: [],
      skinState: null,
      fingerFatigue: null,
    });
    db.runSync(`UPDATE sessions SET ended_at = ? WHERE id = ?`, [5000, sessionId]);

    // Insert 1 Flash (V5), 1 Top (V4), 1 Attempt (V6)
    insertBoulderLog({
      id: 'climb_flash',
      groupId: sessionId,
      gradeRaw: 'V5',
      normalizedDifficulty: 5,
      outcome: 'flash',
      attempts: 1,
      timestamp: 2000,
      session_id: sessionId,
    } as any);

    insertBoulderLog({
      id: 'climb_top',
      groupId: sessionId,
      gradeRaw: 'V4',
      normalizedDifficulty: 4,
      outcome: 'send', // 'send' / top
      attempts: 2,
      timestamp: 3000,
      session_id: sessionId,
    } as any);

    insertBoulderLog({
      id: 'climb_attempt',
      groupId: sessionId,
      gradeRaw: 'V6',
      normalizedDifficulty: 6,
      outcome: 'attempt',
      attempts: 3,
      timestamp: 4000,
      session_id: sessionId,
    } as any);

    let summary = getSessionSummary(sessionId);
    expect(summary.climbs).toBe(3);
    expect(summary.sends).toBe(2); // Flash + Top
    expect(summary.flashes).toBe(1);
    expect(summary.hardestGradeRaw).toBe('V5'); // Hardest send, not attempt

    // Soft delete the Flash
    softDeleteBoulderLog('climb_flash');
    summary = getSessionSummary(sessionId);
    expect(summary.climbs).toBe(2);
    expect(summary.sends).toBe(1);
    expect(summary.flashes).toBe(0);
    expect(summary.hardestGradeRaw).toBe('V4');

    // Soft delete the Top
    softDeleteBoulderLog('climb_top');
    summary = getSessionSummary(sessionId);
    expect(summary.climbs).toBe(1);
    expect(summary.sends).toBe(0);
    expect(summary.flashes).toBe(0);
    expect(summary.hardestGradeRaw).toBe('–');

    // Restore the Top
    undoDeleteBoulderLog('climb_top');
    summary = getSessionSummary(sessionId);
    expect(summary.climbs).toBe(2);
    expect(summary.sends).toBe(1);
    expect(summary.hardestGradeRaw).toBe('V4');

    // Soft delete the entire session
    softDeleteSession(sessionId);
    const deletedSession = db.getFirstSync(`SELECT * FROM sessions WHERE id = ? AND deleted_at IS NULL`, [sessionId]);
    expect(deletedSession).toBeFalsy();

    // Undo delete session
    undoDeleteSession(sessionId);
    summary = getSessionSummary(sessionId);
    expect(summary.climbs).toBe(2);
    expect(summary.sends).toBe(1);
  });
});
