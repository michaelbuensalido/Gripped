import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('cruxlog_v2.db'); // New DB file to wipe old data
    _db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      -- Local-only tables
      CREATE TABLE IF NOT EXISTS outbox (
        op_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        op_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        table_name TEXT PRIMARY KEY,
        last_pulled_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS photo_queue (
        id TEXT PRIMARY KEY,
        local_uri TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL
      );

      -- Synced tables
      CREATE TABLE IF NOT EXISTS gyms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT,
        address TEXT,
        lat REAL,
        lng REAL,
        grade_system TEXT,
        created_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        server_updated_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS walls (
        id TEXT PRIMARY KEY,
        gym_id TEXT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        server_updated_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        gym_id TEXT,
        gym_name TEXT NOT NULL DEFAULT '',
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        effort INTEGER,
        notes TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        rpe INTEGER,
        skin_state TEXT,
        finger_fatigue TEXT,
        media_uris TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        server_updated_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        grade_raw TEXT NOT NULL,
        grade_index INTEGER NOT NULL,
        wall_angle TEXT NOT NULL,
        hold_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        high_water_mark_moves INTEGER NOT NULL DEFAULT 0,
        total_moves INTEGER,
        micro_beta TEXT,
        photo_url TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        server_updated_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS climbs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        user_id TEXT,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        grade_index INTEGER NOT NULL DEFAULT 0,
        grade_raw TEXT NOT NULL DEFAULT 'V0',
        colour TEXT,
        result TEXT NOT NULL DEFAULT 'attempt',
        attempts INTEGER NOT NULL DEFAULT 1,
        rating INTEGER,
        notes TEXT,
        photo_url TEXT,
        logged_at INTEGER NOT NULL,
        failure_reason TEXT,
        wall_angle TEXT,
        hold_type TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        server_updated_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE INDEX IF NOT EXISTS idx_climbs_session ON climbs(session_id);
      CREATE INDEX IF NOT EXISTS idx_climbs_project ON climbs(project_id);
    `);
  }
  return _db;
}


    const columnsToAdd = [
      "ALTER TABLE sessions ADD COLUMN effort INTEGER;",
      "ALTER TABLE sessions ADD COLUMN notes TEXT NOT NULL DEFAULT '';",
      "ALTER TABLE sessions ADD COLUMN title TEXT NOT NULL DEFAULT '';",
      "ALTER TABLE sessions ADD COLUMN rpe INTEGER;",
      "ALTER TABLE climbs ADD COLUMN notes TEXT;",
      "ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'not_started';",
      "ALTER TABLE projects ADD COLUMN total_moves INTEGER;",
      "ALTER TABLE projects ADD COLUMN high_water_mark_moves INTEGER;",
      "ALTER TABLE projects ADD COLUMN micro_beta TEXT;",
    ];
    for (const sql of columnsToAdd) {
      try {
        _db.execSync(sql);
      } catch (e) {}
    }

export async function initializeDatabase(): Promise<void> {
  getDatabase();
}
