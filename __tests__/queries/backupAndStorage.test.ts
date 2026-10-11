import { exportDataToJSON, importDataFromJSON, getStorageUsage, clearAllData, clearAllSessionData, insertSession, getActiveSession } from '../../db/queries';
import { getDatabase } from '../../db/schema';

describe('Backup, Restore, and Storage Management', () => {
  beforeEach(() => {
    clearAllData();
  });

  afterAll(() => {
    clearAllData();
  });

  test('exportDataToJSON exports structured valid JSON', async () => {
    insertSession({
      id: 'test_sess_1',
      gymName: 'MetroRock',
      startTime: Date.now() - 3600000,
      notes: 'Good session',
      rpe: 4,
    });

    const json = await exportDataToJSON();
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('sessions');
    expect(parsed.sessions.length).toBe(1);
    expect(parsed.sessions[0].id).toBe('test_sess_1');
    expect(parsed.sessions[0].gym_name).toBe('MetroRock');
  });

  test('importDataFromJSON imports tables correctly', async () => {
    const backupData = {
      sessions: [
        {
          id: 'imported_sess_1',
          gym_name: 'The Cliffs',
          started_at: 1700000000000,
          ended_at: 1700003600000,
          rpe: 3,
          created_at: 1700000000000,
          updated_at: 1700003600000,
        },
      ],
      climbs: [
        {
          id: 'imported_climb_1',
          session_id: 'imported_sess_1',
          grade_raw: 'V5',
          grade_index: 5,
          result: 'send',
          attempts: 2,
          logged_at: 1700001000000,
          created_at: 1700001000000,
          updated_at: 1700001000000,
        },
      ],
    };

    const res = await importDataFromJSON(JSON.stringify(backupData));
    expect(res.success).toBe(true);
    expect(res.importedCount).toBe(2);

    const db = getDatabase();
    const sessionRow = db.getFirstSync<any>('SELECT * FROM sessions WHERE id = ?', ['imported_sess_1']);
    expect(sessionRow).not.toBeNull();
    expect(sessionRow.gym_name).toBe('The Cliffs');

    const climbRow = db.getFirstSync<any>('SELECT * FROM climbs WHERE id = ?', ['imported_climb_1']);
    expect(climbRow).not.toBeNull();
    expect(climbRow.grade_raw).toBe('V5');
  });

  test('importDataFromJSON rejects invalid JSON and non-CruxLog data', async () => {
    await expect(importDataFromJSON('not json')).rejects.toThrow('Invalid JSON format');
    await expect(importDataFromJSON(JSON.stringify({ randomKey: 'invalid' }))).rejects.toThrow('No valid CruxLog data tables found');
  });

  test('clearAllData wipes all tables', () => {
    insertSession({
      id: 'sess_to_wipe',
      gymName: 'Brooklyn Boulders',
      startTime: Date.now(),
      notes: '',
    });

    clearAllData();

    const active = getActiveSession();
    expect(active).toBeNull();

    const db = getDatabase();
    const count = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM sessions');
    expect(count?.c).toBe(0);
  });

  test('getStorageUsage returns calculated values', async () => {
    const usage = await getStorageUsage();
    expect(usage).toHaveProperty('dbBytes');
    expect(usage).toHaveProperty('mediaBytes');
    expect(usage).toHaveProperty('totalBytes');
    expect(usage).toHaveProperty('formatted');
    expect(typeof usage.formatted).toBe('string');
  });
});
