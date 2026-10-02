import { getDatabase } from '../../db/schema';
import { getLogbookSummary } from '../../db/queries';

jest.mock('../../db/schema', () => {
  const original = jest.requireActual('../../db/schema');
  return { ...original };
});

describe('Logbook total time', () => {
  const db = getDatabase();
  
  beforeEach(() => {
    db.runSync(`DELETE FROM climbs`);
    db.runSync(`DELETE FROM sessions`);
  });

  const insertSession = (id: string, started_at: number, ended_at: number | null) => {
    db.runSync(
      `INSERT INTO sessions (id, gym_name, started_at, ended_at, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, 'Test Gym', started_at, ended_at, '', started_at, started_at]
    );
  };

  const insertClimb = (id: string, session_id: string, logged_at: number, grade_index: number, result: string = 'top', deleted: boolean = false) => {
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, session_id, `V${grade_index}`, grade_index, result, 1, logged_at, logged_at, logged_at, deleted ? logged_at : null]
    );
  };

  it('sums each session duration once regardless of climbs', () => {
    const s1 = 's1';
    insertSession(s1, 1000, 3000); // 2000 ms
    insertClimb('c1', s1, 1500, 5, 'top', false);
    insertClimb('c2', s1, 2500, 5, 'attempt', false);

    const s2 = 's2';
    insertSession(s2, 4000, 9000); // 5000 ms
    insertClimb('c3', s2, 5000, 5, 'top', false);

    const summary = getLogbookSummary({
      viewMode: 'list',
      period: 'all',
      sort: 'newest',
      showEmpty: true,
      selectedDate: null,
      gym: null,
      minGradeIndex: null,
      searchQuery: null,
    }, 10000);
    
    // total duration should be 2000 + 5000 = 7000
    expect(summary.durationMs).toBe(7000);
  });
});
