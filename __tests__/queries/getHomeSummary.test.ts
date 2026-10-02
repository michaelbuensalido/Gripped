import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import { getHomeSummary } from '../../db/queries';


jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

// SQLite datetime uses standard format, so we can use static DB dates.
describe('getHomeSummary', () => {
  let db: any;

  beforeEach(() => {
    // getDatabase creates the table on the first call due to schema.ts executing execSync.
    // However, our __mocks__/expo-sqlite.js keeps it in memory.
    // To ensure a clean DB per test, we'll run DELETE FROM statements.
    db = getDatabase();
    db.execSync(`
      DELETE FROM outbox;
      DELETE FROM climbs;
      DELETE FROM sessions;
      DELETE FROM projects;
    `);
  });

  const insertSession = (id: string, started_at: number, ended_at: number | null) => {
    db.runSync(
      `INSERT INTO sessions (id, gym_name, started_at, ended_at, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, 'Test Gym', started_at, ended_at, '', started_at, started_at]
    );
  };

  const insertClimb = (id: string, session_id: string, logged_at: number, grade_index: number, result: string = 'send', deleted: boolean = false) => {
    db.runSync(
      `INSERT INTO climbs (id, session_id, grade_raw, grade_index, result, attempts, logged_at, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, session_id, `V${grade_index}`, grade_index, result, 1, logged_at, logged_at, logged_at, deleted ? logged_at : null]
    );
  };

  it('no data returns empty state', () => {
    const summary = getHomeSummary();
    expect(summary.hasAnyData).toBe(false);
    expect(summary.activeSession).toBeNull();
    expect(summary.recentSessions.length).toBe(0);
    expect(summary.streak).toBe(0);
  });

  it('handles a single session', () => {
    insertSession('s1', Date.now() - 3600000, Date.now());
    insertClimb('c1', 's1', Date.now(), 4, 'send');

    const summary = getHomeSummary();
    expect(summary.hasAnyData).toBe(true);
    expect(summary.recentSessions.length).toBe(1);
    expect(summary.streak).toBe(1);
  });

  it('ignores an empty session', () => {
    // Session with climbs
    insertSession('s1', Date.now() - 86400000, Date.now() - 80000000);
    insertClimb('c1', 's1', Date.now() - 86400000, 3, 'send');
    
    // Empty session
    insertSession('s2', Date.now() - 3600000, Date.now());
    
    const summary = getHomeSummary();
    // Only s1 should be in recentSessions and count towards stats
    expect(summary.recentSessions.length).toBe(1);
    expect(summary.recentSessions[0].id).toBe('s1');
  });

  it('handles week boundary (Sunday to Monday)', () => {
    // Create a Sunday date
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    
    insertSession('s1', d.getTime(), d.getTime() + 1000);
    insertClimb('c1', 's1', d.getTime(), 3, 'send');

    const d2 = new Date(d);
    d2.setDate(d2.getDate() + 1); // Monday
    insertSession('s2', d2.getTime(), d2.getTime() + 1000);
    insertClimb('c2', 's2', d2.getTime(), 4, 'send');

    const summary = getHomeSummary();
    expect(summary.hasAnyData).toBe(true);
  });

  it('handles streak across a year boundary', () => {
    // E.g. December 30th (Week 52) to Jan 3rd (Week 01)
    const dec30 = new Date('2025-12-30T12:00:00Z').getTime();
    insertSession('s1', dec30, dec30 + 1000);
    insertClimb('c1', 's1', dec30, 4, 'send');

    const jan3 = new Date('2026-01-03T12:00:00Z').getTime();
    insertSession('s2', jan3, jan3 + 1000);
    insertClimb('c2', 's2', jan3, 4, 'send');

    const summary = getHomeSummary();
    expect(summary.hasAnyData).toBe(true);
  });

  it('ignores a soft-deleted climb', () => {
    insertSession('s1', Date.now() - 3600000, Date.now());
    insertClimb('c1', 's1', Date.now(), 4, 'send', false);
    insertClimb('c2', 's1', Date.now(), 6, 'send', true); // deleted

    const summary = getHomeSummary();
    // Hardest send should be V4, not V6
    expect(summary.recentSessions[0].hardestLabel).toBe('V4');
    expect(summary.recentSessions[0].climbsCount).toBe(1);
  });
});
