import { getDatabase, initializeDatabase } from '../../db/schema';
import { clearAllSessionData, insertSession, finishSession, logClimbForSession, getLogbookSummary } from '../../db/queries';

describe('Logbook Summary Fan-Out Fix', () => {
  beforeEach(async () => {
    await initializeDatabase();
    clearAllSessionData();
  });

  afterEach(() => {
    clearAllSessionData();
  });

  it('aggregates duration and session count correctly without fan-out', () => {
    const db = getDatabase();
    
    // Seed test: session with 1 climb
    insertSession({ id: 's1', gymName: 'Gym', startTime: 1000, notes: '' });
    logClimbForSession('s1', { gradeRaw: 'V1', result: 'top' });
    finishSession('s1', 2000); // duration: 1000ms

    // Seed test: session with 2 climbs
    insertSession({ id: 's2', gymName: 'Gym', startTime: 3000, notes: '' });
    logClimbForSession('s2', { gradeRaw: 'V1', result: 'top' });
    logClimbForSession('s2', { gradeRaw: 'V1', result: 'top' });
    finishSession('s2', 4000); // duration: 1000ms

    // Seed test: session with 30 climbs
    insertSession({ id: 's3', gymName: 'Gym', startTime: 5000, notes: '' });
    for (let i = 0; i < 30; i++) {
      logClimbForSession('s3', { gradeRaw: 'V1', result: 'top' });
    }
    finishSession('s3', 6000); // duration: 1000ms

    const summary = getLogbookSummary({
      viewMode: 'list',
      period: 'all',
      gym: null,
      minGradeIndex: null,
      searchQuery: null,
      sort: 'newest',
      showEmpty: true,
      selectedDate: null,
    }, 10000);

    // 3 sessions total
    expect(summary.sessions).toBe(3);
    // 1 + 2 + 30 = 33 climbs
    expect(summary.climbs).toBe(33);
    // 33 sends
    expect(summary.sends).toBe(33);
    // Each session took 1000ms => Total duration = 3000ms.
    // If fan-out bug existed, it would be (1*1000) + (2*1000) + (30*1000) = 33000ms
    expect(summary.durationMs).toBe(3000);
  });
});
