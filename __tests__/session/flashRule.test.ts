import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import { useSessionStore } from '../../store/sessionStore';
import * as Q from '../../db/queries';

describe('Flash Rule & Grade Locking Logic', () => {
  let db: any;

  beforeEach(() => {
    db = getDatabase();
    db.execSync(`
      DELETE FROM outbox;
      DELETE FROM climbs;
      DELETE FROM projects;
      DELETE FROM sessions;
    `);
    useSessionStore.setState({ activeSessionId: null, pendingAttemptId: null });
  });

  it('allows flash on attempt #1 of a new climb', () => {
    const sessionId = 'session_test_flash_1';
    Q.insertSession({
      id: sessionId,
      gymName: 'Crux Gym',
      startTime: Date.now(),
      notes: '',
    });
    useSessionStore.setState({ activeSessionId: sessionId });

    const climbId = useSessionStore.getState().logGenericAscent({
      gradeRaw: 'V5',
      outcome: 'flash',
      movesLinked: 1,
    });

    const climb = db.getFirstSync(`SELECT * FROM climbs WHERE id = ?`, [climbId]);
    expect(climb).toBeDefined();
    expect(climb.result).toBe('flash');
    expect(climb.attempts).toBe(1);
  });

  it('coerces flash to send when attempts > 1 (flash is impossible on attempt > 1)', () => {
    const sessionId = 'session_test_flash_2';
    Q.insertSession({
      id: sessionId,
      gymName: 'Crux Gym',
      startTime: Date.now(),
      notes: '',
    });
    useSessionStore.setState({ activeSessionId: sessionId });

    const climbId = useSessionStore.getState().logGenericAscent({
      gradeRaw: 'V6',
      outcome: 'flash',
      movesLinked: 3, // 3 attempts / burns
    });

    const climb = db.getFirstSync(`SELECT * FROM climbs WHERE id = ?`, [climbId]);
    expect(climb).toBeDefined();
    expect(climb.result).toBe('send'); // coerced
    expect(climb.attempts).toBe(3);
  });

  it('coerces flash to send on a project with prior recorded attempts', () => {
    const sessionId = 'session_test_flash_3';
    const projectId = 'proj_test_prior_burns';

    Q.insertSession({
      id: sessionId,
      gymName: 'Crux Gym',
      startTime: Date.now(),
      notes: '',
    });
    Q.insertProject({
      id: projectId,
      title: 'Dyno Project',
      gradeRaw: 'V7',
      gradeIndex: 7,
      wallAngle: 'overhang',
      holdType: 'crimps',
      status: 'in_progress',
      highWaterMarkMoves: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    useSessionStore.setState({ activeSessionId: sessionId });

    // 1st attempt was a fall
    useSessionStore.getState().logGenericAscent({
      projectId,
      gradeRaw: 'V7',
      outcome: 'attempt',
      movesLinked: 1,
    });

    // 2nd ascent attempted as flash
    const secondClimbId = useSessionStore.getState().logGenericAscent({
      projectId,
      gradeRaw: 'V7',
      outcome: 'flash',
      movesLinked: 1,
    });

    const climb = db.getFirstSync(`SELECT * FROM climbs WHERE id = ?`, [secondClimbId]);
    expect(climb).toBeDefined();
    expect(climb.result).toBe('send'); // coerced to send because project had prior attempts
  });

  it('allows flash on a fresh project with 0 prior attempts on burn 1', () => {
    const sessionId = 'session_test_flash_4';
    const projectId = 'proj_fresh_burn';

    Q.insertSession({
      id: sessionId,
      gymName: 'Crux Gym',
      startTime: Date.now(),
      notes: '',
    });
    Q.insertProject({
      id: projectId,
      title: 'Fresh Project',
      gradeRaw: 'V4',
      gradeIndex: 4,
      wallAngle: 'slab',
      holdType: 'slopers',
      status: 'in_progress',
      highWaterMarkMoves: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    useSessionStore.setState({ activeSessionId: sessionId });

    const climbId = useSessionStore.getState().logGenericAscent({
      projectId,
      gradeRaw: 'V4',
      outcome: 'flash',
      movesLinked: 1,
    });

    const climb = db.getFirstSync(`SELECT * FROM climbs WHERE id = ?`, [climbId]);
    expect(climb).toBeDefined();
    expect(climb.result).toBe('flash');
    expect(climb.project_id).toBe(projectId);
  });
});
