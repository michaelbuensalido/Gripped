import { getDatabase } from '../../db/schema';
import { getHomeSummary } from '../../db/queries';

describe('New Best Celebration', () => {
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

  it('only fires for a strictly higher grade, never on a tie', () => {
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    
    // Previous best was V5 a year ago
    insertSession('s1', oneYearAgo, oneYearAgo + 3600);
    insertClimb('c1', 's1', oneYearAgo + 1000, 5, 'top', false); // V5
    
    // Tied the best today
    insertSession('s2', now - 3600, now);
    insertClimb('c2', 's2', now - 1000, 5, 'top', false); // V5 again

    const summaryTie = getHomeSummary();
    
    // Since the first time V5 was climbed was a year ago, it is not a new best in the last 14 days
    expect(summaryTie.personalBest).toBeNull();
    
    // Now they climb a V6 (strictly higher)
    insertClimb('c3', 's2', now - 500, 6, 'top', false); // V6
    
    const summaryNew = getHomeSummary();
    expect(summaryNew.personalBest).not.toBeNull();
    expect(summaryNew.personalBest?.gradeRaw).toBe('V6');
  });
});
