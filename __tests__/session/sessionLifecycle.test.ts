import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import * as Q from '../../db/queries';

describe('Session Lifecycle & Edge Cases', () => {
  let db: any;

  beforeEach(() => {
    db = getDatabase();
    db.execSync(`
      DELETE FROM outbox;
      DELETE FROM climbs;
      DELETE FROM projects;
      DELETE FROM sessions;
    `);
  });

  it('starts an active session that is queryable as active', () => {
    const sessionId = 'session_life_1';
    const startTime = Date.now();
    Q.insertSession({
      id: sessionId,
      gymName: 'Gravity Vault',
      startTime,
      notes: '',
    });

    const active = Q.getActiveSession();
    expect(active).not.toBeNull();
    expect(active?.id).toBe(sessionId);
    expect(active?.gymName).toBe('Gravity Vault');
    expect(active?.startTime).toBe(startTime);
    expect(active?.endTime).toBeNull();
  });

  it('logs, edits, deletes, and un-deletes climbs in an active session', () => {
    const sessionId = 'session_life_2';
    Q.insertSession({
      id: sessionId,
      gymName: 'Crux Gym',
      startTime: Date.now(),
      notes: '',
    });

    // 1. Log climb
    const climbId = 'climb_life_c1';
    const now = Date.now();
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, notes, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [climbId, sessionId, 'V4', 4, 'top', 1, 'Felt solid', now, now, now]
    );

    let climbs = Q.getClimbsForSession(sessionId);
    expect(climbs.length).toBe(1);
    expect(climbs[0].grade_raw).toBe('V4');

    // 2. Edit climb
    Q.updateClimb(climbId, {
      gradeRaw: 'V5',
      result: 'flash',
      attempts: 1,
      notes: 'Actually upgraded to V5',
    });

    climbs = Q.getClimbsForSession(sessionId);
    expect(climbs.length).toBe(1);
    expect(climbs[0].id).toBe(climbId); // Same ID preserved
    expect(climbs[0].grade_raw).toBe('V5');
    expect(climbs[0].result).toBe('flash');
    expect(climbs[0].notes).toBe('Actually upgraded to V5');

    // 3. Delete climb (soft delete)
    Q.softDeleteBoulderLog(climbId);
    climbs = Q.getClimbsForSession(sessionId);
    expect(climbs.length).toBe(0); // Excluded from active session list

    // 4. Undo delete
    Q.undoDeleteBoulderLog(climbId);
    climbs = Q.getClimbsForSession(sessionId);
    expect(climbs.length).toBe(1);
    expect(climbs[0].id).toBe(climbId);
  });

  it('completes session wrap-up with RPE, skin state, finger state, and notes', () => {
    const sessionId = 'session_life_3';
    const startTime = Date.now() - 3600000; // 1 hour ago
    Q.insertSession({
      id: sessionId,
      gymName: 'Movement Gym',
      startTime,
      notes: '',
    });

    const endTime = Date.now();
    Q.completeSessionWrapUp(
      sessionId,
      endTime,
      'Friday Night Send Train',
      'Felt strong on crimps today.',
      'Movement Gym',
      4, // RPE / effort
      ['file:///photo1.jpg'],
      'Thin', // skin state
      'Tired' // finger fatigue
    );

    // Should no longer be active
    const active = Q.getActiveSession();
    expect(active).toBeNull();

    // Query session detail
    const session = Q.getSessionById(sessionId);
    expect(session).not.toBeNull();
    expect(session?.endTime).toBe(endTime);
    expect(session?.title).toBe('Friday Night Send Train');
    expect(session?.notes).toBe('Felt strong on crimps today.');
    expect(session?.rpe).toBe(4);
    expect(session?.skinState).toBe('Thin');
    expect(session?.fingerFatigue).toBe('Tired');
    expect(session?.mediaUris).toEqual(['file:///photo1.jpg']);
  });

  it('handles ending twice idempotently without crashing', () => {
    const sessionId = 'session_life_double_end';
    Q.insertSession({
      id: sessionId,
      gymName: 'Double Gym',
      startTime: Date.now() - 1000,
      notes: '',
    });

    const end1 = Date.now();
    Q.completeSessionWrapUp(sessionId, end1, 'Title 1', 'Notes 1', 'Double Gym', 3, []);
    
    // Ending twice immediately
    const end2 = Date.now() + 50;
    expect(() => {
      Q.completeSessionWrapUp(sessionId, end2, 'Title 2', 'Notes 2', 'Double Gym', 3, []);
    }).not.toThrow();

    const session = Q.getSessionById(sessionId);
    expect(session?.endTime).toBeDefined();
  });

  it('handles ending an empty session cleanly', () => {
    const sessionId = 'session_empty_end';
    Q.insertSession({
      id: sessionId,
      gymName: 'Empty Gym',
      startTime: Date.now() - 60000,
      notes: '',
    });

    expect(() => {
      Q.completeSessionWrapUp(sessionId, Date.now(), 'Empty Session', '', 'Empty Gym', null, []);
    }).not.toThrow();

    const session = Q.getSessionById(sessionId);
    expect(session?.endTime).toBeDefined();

    const summary = Q.getSessionSummary(sessionId);
    expect(summary.climbs).toBe(0);
    expect(summary.sends).toBe(0);
    expect(summary.hardestGradeRaw).toBe('–');
  });

  it('preserves climb history when a project is deleted', () => {
    const sessionId = 'session_proj_delete';
    const projectId = 'proj_to_be_deleted';

    Q.insertSession({
      id: sessionId,
      gymName: 'Project Gym',
      startTime: Date.now(),
      notes: '',
    });

    Q.insertProject({
      id: projectId,
      title: 'Project To Delete',
      gradeRaw: 'V8',
      gradeIndex: 8,
      wallAngle: 'roof',
      holdType: 'crimps',
      status: 'in_progress',
      highWaterMarkMoves: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const climbId = 'climb_linked_to_proj';
    const now = Date.now();
    db.runSync(
      `INSERT INTO climbs (id, session_id, project_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [climbId, sessionId, projectId, 'V8', 8, 'top', 3, now, now, now]
    );

    // Verify climb is initially linked
    let climb = db.getFirstSync(`SELECT * FROM climbs WHERE id = ?`, [climbId]);
    expect(climb.project_id).toBe(projectId);

    // Delete the project
    Q.deleteProject(projectId);

    // Verify project is deleted
    const project = db.getFirstSync(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    expect(project).toBeFalsy();

    // Verify climb still exists in the session with project_id safely unlinked (NULL)
    climb = db.getFirstSync(`SELECT * FROM climbs WHERE id = ?`, [climbId]);
    expect(climb).toBeDefined();
    expect(climb.project_id).toBeNull();
    expect(climb.grade_raw).toBe('V8');
    expect(climb.result).toBe('top');

    const sessionClimbs = Q.getClimbsForSession(sessionId);
    expect(sessionClimbs.length).toBe(1);
  });

  it('cascades deletion of session and climbs on discard', () => {
    const sessionId = 'session_to_discard';
    Q.insertSession({
      id: sessionId,
      gymName: 'Discard Gym',
      startTime: Date.now(),
      notes: '',
    });

    const now = Date.now();
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['c_discard', sessionId, 'V2', 2, 'top', 1, now, now, now]
    );

    expect(Q.getClimbsForSession(sessionId).length).toBe(1);

    // Discard session
    Q.deleteSession(sessionId);

    // Session and climbs should both be gone
    expect(Q.getSessionById(sessionId)).toBeNull();
    expect(Q.getClimbsForSession(sessionId).length).toBe(0);
  });
});
