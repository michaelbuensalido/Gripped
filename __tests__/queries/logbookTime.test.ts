import { getDatabase } from '../../db/schema';
import { getLogbookSummary, insertSession, insertClimb } from '../../db/queries';

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

  it('sums each session duration once regardless of climbs', () => {
    const s1 = 's1';
    insertSession(s1, 1000, 3000); // 2000 ms
    insertClimb('c1', s1, 1500, 5, 'top', false);
    insertClimb('c2', s1, 2500, 5, 'attempt', false);

    const s2 = 's2';
    insertSession(s2, 4000, 9000); // 5000 ms
    insertClimb('c3', s2, 5000, 5, 'top', false);

    const summary = getLogbookSummary({ period: 'all', sort: 'newest', showEmpty: true, selectedDate: null, gym: null }, 10000);
    
    // total duration should be 2000 + 5000 = 7000
    expect(summary.current.durationMs).toBe(7000);
  });
});
