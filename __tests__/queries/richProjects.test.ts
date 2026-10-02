import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import { getRichProjects, insertProject, insertSession, softDeleteBoulderLog } from '../../db/queries';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('getRichProjects', () => {
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

  const createClimb = (id: string, sessionId: string, projectId: string, loggedAt: number) => {
    db.runSync(
      `INSERT INTO climbs (id, session_id, project_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sessionId, projectId, 'V4', 4, 'attempt', 1, loggedAt, Date.now(), Date.now()]
    );
  };

  it('calculates lastTriedAt with no attempts', () => {
    insertProject({
      id: 'p1', title: 'P1', gradeRaw: 'V4', normalizedDifficulty: 4, wallAngle: 'slab', holdType: 'crimps', status: 'in_progress', highWaterMarkMoves: 0, totalMoves: 12, microBeta: null, mediaUri: null
    });
    
    const projects = getRichProjects();
    expect(projects[0].lastTriedAt).toBeNull();
  });

  it('calculates lastTriedAt correctly ignoring soft-deleted climbs', () => {
    insertProject({
      id: 'p1', title: 'P1', gradeRaw: 'V4', normalizedDifficulty: 4, wallAngle: 'slab', holdType: 'crimps', status: 'in_progress', highWaterMarkMoves: 0, totalMoves: 12, microBeta: null, mediaUri: null
    });
    insertSession({ id: 's1', gymName: 'Gym', startTime: 1000, notes: '' });
    
    createClimb('c1', 's1', 'p1', 2000);
    createClimb('c2', 's1', 'p1', 3000);

    let projects = getRichProjects();
    expect(projects[0].lastTriedAt).toBe(3000);

    softDeleteBoulderLog('c2');

    projects = getRichProjects();
    expect(projects[0].lastTriedAt).toBe(2000); // Should fallback to c1
  });

  it('calculates burns-per-session (max 6)', () => {
    insertProject({
      id: 'p1', title: 'P1', gradeRaw: 'V4', normalizedDifficulty: 4, wallAngle: 'slab', holdType: 'crimps', status: 'in_progress', highWaterMarkMoves: 0, totalMoves: 12, microBeta: null, mediaUri: null
    });
    
    for (let i = 1; i <= 7; i++) {
      insertSession({ id: `s${i}`, gymName: 'Gym', startTime: i * 1000, notes: '' });
      createClimb(`c${i}_1`, `s${i}`, 'p1', i * 1000 + 1);
      if (i % 2 === 0) {
        createClimb(`c${i}_2`, `s${i}`, 'p1', i * 1000 + 2); // 2 burns on even sessions
      }
    }
    
    const projects = getRichProjects();
    // 7 sessions, sorted by loggedAt DESC (so session 7 is first, session 1 is last).
    // The query returns `.slice(0, 6).reverse()`.
    // Session counts: 
    // s7: 1
    // s6: 2
    // s5: 1
    // s4: 2
    // s3: 1
    // s2: 2
    // s1: 1
    // Top 6 are s7..s2. Reversed: s2..s7.
    // Expected: [2, 1, 2, 1, 2, 1]
    expect(projects[0].burnsPerSession).toEqual([2, 1, 2, 1, 2, 1]);
  });
});
