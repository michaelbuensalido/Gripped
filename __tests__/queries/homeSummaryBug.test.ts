import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import { getHomeSummary, insertSession, deleteSession } from '../../db/queries';

let mockIdCounter = 0;
jest.mock('uuid', () => ({ v4: () => `test-uuid-homebug-${mockIdCounter++}` }));

describe('getHomeSummary bug', () => {
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

  const createClimb = (id: string, sessionId: string, loggedAt: number) => {
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sessionId, 'V4', 4, 'top', 1, loggedAt, Date.now(), Date.now()]
    );
  };

  it('excludes orphaned climbs from discarded sessions', () => {
    // Insert an older valid session with a flash
    insertSession({ id: 's1', gymName: 'Gym', startTime: Date.now() - 100000, notes: '' });
    db.runSync(`UPDATE sessions SET ended_at = ? WHERE id = ?`, [Date.now() - 50000, 's1']);
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['c0', 's1', 'V2', 2, 'flash', 1, Date.now() - 90000, Date.now(), Date.now()]
    );

    // Insert a new session today
    insertSession({ id: 's2', gymName: 'Gym', startTime: Date.now() - 5000, notes: '' });
    createClimb('c1', 's2', Date.now() - 4000);
    createClimb('c2', 's2', Date.now() - 3000);

    // Now DISCARD the new session
    deleteSession('s2');
    
    // c1 and c2 are orphaned (SQLite cascade mock might not delete them if pragma wasn't enforced in this test tick)
    // But getHomeSummary should ignore them anyway because it joins on sessions!
    
    const summary = getHomeSummary();
    
    // Should not see V4 (gradeIndex 4) as personal best
    if (summary.personalBest) {
      expect(summary.personalBest.gradeRaw).not.toBe('V4');
    }
    
    // Should only see the 1 flash from s1 in this week's stats
    expect(summary.flashesThisWeek).toBe(1);
    expect(summary.sendsThisWeek).toBe(1); // Only the V2
    expect(summary.climbsThisWeek).toBe(1);
  });
});
