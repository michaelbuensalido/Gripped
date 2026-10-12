import { getDatabase, initializeDatabase } from '../../db/schema';

describe('Database Schema & Migration Idempotency', () => {
  it('initializes database and creates all required tables', async () => {
    await initializeDatabase();
    const db = getDatabase();

    const tables = db.getAllSync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );
    const tableNames = tables.map((t) => t.name);

    const requiredTables = [
      'outbox',
      'sync_state',
      'photo_queue',
      'gyms',
      'walls',
      'sessions',
      'projects',
      'climbs',
      'betas',
      'beta_moves',
      'beta_videos',
      'video_notes',
    ];

    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }
  });

  it('contains all migrated columns in sessions, projects, and climbs', () => {
    const db = getDatabase();

    // Verify sessions columns
    const sessionCols = db.getAllSync<{ name: string }>(`PRAGMA table_info(sessions)`).map((c) => c.name);
    expect(sessionCols).toContain('effort');
    expect(sessionCols).toContain('notes');
    expect(sessionCols).toContain('title');
    expect(sessionCols).toContain('rpe');
    expect(sessionCols).toContain('skin_state');
    expect(sessionCols).toContain('finger_fatigue');
    expect(sessionCols).toContain('media_uris');

    // Verify projects columns
    const projectCols = db.getAllSync<{ name: string }>(`PRAGMA table_info(projects)`).map((c) => c.name);
    expect(projectCols).toContain('status');
    expect(projectCols).toContain('total_moves');
    expect(projectCols).toContain('high_water_mark_moves');
    expect(projectCols).toContain('micro_beta');
    expect(projectCols).toContain('gym_name');
    expect(projectCols).toContain('zone');
    expect(projectCols).toContain('set_date');

    // Verify climbs columns
    const climbCols = db.getAllSync<{ name: string }>(`PRAGMA table_info(climbs)`).map((c) => c.name);
    expect(climbCols).toContain('notes');
    expect(climbCols).toContain('failure_reason');
    expect(climbCols).toContain('attempts');
    expect(climbCols).toContain('result');
  });

  it('runs migrations repeatedly without error (idempotent)', async () => {
    // Calling initializeDatabase multiple times simulates app restarts and consecutive migrations
    await expect(initializeDatabase()).resolves.toBeUndefined();
    await expect(initializeDatabase()).resolves.toBeUndefined();
  });

  it('verifies indices exist for performance', () => {
    const db = getDatabase();
    const indices = db.getAllSync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='index'`
    ).map((i) => i.name);

    expect(indices).toContain('idx_climbs_session');
    expect(indices).toContain('idx_climbs_project');
    expect(indices).toContain('idx_betas_project');
    expect(indices).toContain('idx_beta_moves_beta');
    expect(indices).toContain('idx_beta_videos_project');
  });
});
