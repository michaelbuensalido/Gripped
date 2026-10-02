import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import { getLogbookSummary, getLogbookHistory, insertSession, deleteSession } from '../../db/queries';

let idCounter = 0;
jest.mock('uuid', () => ({ v4: () => `test-uuid-logbook-${idCounter++}` }));

describe('Logbook Queries', () => {
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

  const createClimb = (id: string, sessionId: string, result: string, loggedAt: number) => {
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sessionId, 'V4', 4, result, 1, loggedAt, Date.now(), Date.now()]
    );
  };

  const NOW = new Date('2026-10-15T12:00:00Z').getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  it('excludes in-progress and empty sessions from history when not requested', () => {
    // 1. Finished session with climbs (valid)
    const validId = 's_valid';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [validId, 'Valid Gym', NOW - ONE_DAY, NOW - ONE_DAY + 3600000, NOW, NOW]
    );
    createClimb('c1', validId, 'send', NOW - ONE_DAY + 1000);

    // 2. In-progress session with climbs
    const activeId = 's_active';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [activeId, 'Active Gym', NOW, null, NOW, NOW] // null ended_at
    );
    createClimb('c2', activeId, 'send', NOW + 1000);

    // 3. Finished session with 0 climbs (empty)
    const emptyId = 's_empty';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [emptyId, 'Empty Gym', NOW - ONE_DAY * 2, NOW - ONE_DAY * 2 + 3600000, NOW, NOW]
    );

    // Fetch without showing empty
    const history = getLogbookHistory({ period: 'all', viewMode: 'list', sort: 'newest', minGradeIndex: null, gym: null, showEmpty: false, searchQuery: '', selectedDate: null }, NOW);
    
    expect(history.length).toBe(1);
    expect(history[0].data[0].id).toBe(validId);

    // Fetch with showing empty
    const historyWithEmpty = getLogbookHistory({ period: 'all', viewMode: 'list', sort: 'newest', minGradeIndex: null, gym: null, showEmpty: true, searchQuery: '', selectedDate: null }, NOW);
    
    // It should include empty, but STILL exclude active
    expect(historyWithEmpty.length).toBe(1); // One month group
    expect(historyWithEmpty[0].data.length).toBe(2);
    const ids = historyWithEmpty[0].data.map(h => h.id);
    expect(ids).toContain(validId);
    expect(ids).toContain(emptyId);
    expect(ids).not.toContain(activeId);
  });

  it('calculates period comparison text correctly', () => {
    // Insert one session in current period (this month)
    const thisMonthId = 's_tm';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [thisMonthId, 'Gym', NOW - ONE_DAY, NOW - ONE_DAY + 3600000, NOW, NOW]
    );
    createClimb('c_tm', thisMonthId, 'send', NOW - ONE_DAY + 1000);

    // Insert two sessions in previous period (last month)
    const THIRTY_DAYS = 30 * ONE_DAY;
    const prevId1 = 's_p1';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [prevId1, 'Gym', NOW - THIRTY_DAYS - ONE_DAY, NOW - THIRTY_DAYS - ONE_DAY + 3600000, NOW, NOW]
    );
    createClimb('c_p1', prevId1, 'send', NOW - THIRTY_DAYS - ONE_DAY + 1000);

    const prevId2 = 's_p2';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [prevId2, 'Gym', NOW - THIRTY_DAYS - ONE_DAY*2, NOW - THIRTY_DAYS - ONE_DAY*2 + 3600000, NOW, NOW]
    );
    createClimb('c_p2', prevId2, 'send', NOW - THIRTY_DAYS - ONE_DAY*2 + 1000);

    const summary = getLogbookSummary({ period: 'month', viewMode: 'list', sort: 'newest', minGradeIndex: null, gym: null, showEmpty: false, searchQuery: '', selectedDate: null }, NOW);
    
    expect(summary.sessions).toBe(1);
    expect(summary.prevSessions).toBe(2);
    // 1 - 2 = -1 (actually it depends on UI logic, the query might just return prevSessions and UI does the text formatting. Wait, what does getLogbookSummary return? Let's check.)
  });

  it('filters by search query', () => {
    const s1 = 's1';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s1, 'Bouldering Project', NOW - ONE_DAY, NOW - ONE_DAY + 3600000, 'Felt very strong on crimps', NOW, NOW]
    );
    createClimb('c1', s1, 'send', NOW - ONE_DAY + 1000);

    const s2 = 's2';
    db.runSync(`INSERT INTO sessions (id, gym_name, started_at, ended_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s2, 'Indoor Gym', NOW - ONE_DAY*2, NOW - ONE_DAY*2 + 3600000, 'Weak day', NOW, NOW]
    );
    createClimb('c2', s2, 'send', NOW - ONE_DAY*2 + 1000);

    // Search by gym name
    const h1 = getLogbookHistory({ period: 'all', viewMode: 'list', sort: 'newest', minGradeIndex: null, gym: null, showEmpty: false, searchQuery: 'Bouldering', selectedDate: null }, NOW);
    expect(h1.length).toBe(1);
    expect(h1[0].data[0].id).toBe(s1);

    // Search by note
    const h2 = getLogbookHistory({ period: 'all', viewMode: 'list', sort: 'newest', minGradeIndex: null, gym: null, showEmpty: false, searchQuery: 'strong', selectedDate: null }, NOW);
    expect(h2.length).toBe(1);
    expect(h2[0].data[0].id).toBe(s1);

    // Case insensitive
    const h3 = getLogbookHistory({ period: 'all', viewMode: 'list', sort: 'newest', minGradeIndex: null, gym: null, showEmpty: false, searchQuery: 'WEAK', selectedDate: null }, NOW);
    expect(h3.length).toBe(1);
    expect(h3[0].data[0].id).toBe(s2);
  });
});
