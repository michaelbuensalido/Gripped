import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('cruxlog.db');
    _db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS sessions (
        id          TEXT PRIMARY KEY,
        start_time  INTEGER NOT NULL,
        end_time    INTEGER,
        gym_name    TEXT    NOT NULL DEFAULT '',
        notes       TEXT    NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS boulder_groups (
        id                   TEXT PRIMARY KEY,
        session_id           TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        zone_name            TEXT    NOT NULL DEFAULT 'Main Wall',
        sort_order           INTEGER NOT NULL DEFAULT 0,
        default_rest_seconds INTEGER NOT NULL DEFAULT 90,
        notes                TEXT    NOT NULL DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_groups_session ON boulder_groups(session_id);

      CREATE TABLE IF NOT EXISTS boulder_logs (
        id                    TEXT    PRIMARY KEY,
        group_id              TEXT    NOT NULL REFERENCES boulder_groups(id) ON DELETE CASCADE,
        grade_raw             TEXT    NOT NULL DEFAULT 'V0',
        normalized_difficulty INTEGER NOT NULL DEFAULT 0,
        rpe                   INTEGER,
        attempts              INTEGER NOT NULL DEFAULT 1,
        outcome               TEXT    NOT NULL DEFAULT 'attempt',
        timestamp             INTEGER NOT NULL,
        media_uri             TEXT,
        media_type            TEXT,
        notes                 TEXT,
        failure_reason        TEXT,
        crux_timestamp_ms     INTEGER,
        hang_time_seconds     INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_logs_group ON boulder_logs(group_id);

      -- ─── Routines & Workout Templates ───────────────────────────────────────

      CREATE TABLE IF NOT EXISTS routines (
        id                TEXT PRIMARY KEY,
        title             TEXT NOT NULL,
        description       TEXT NOT NULL DEFAULT '',
        category          TEXT NOT NULL DEFAULT 'Strength',
        is_custom         INTEGER NOT NULL DEFAULT 1,
        estimated_minutes INTEGER NOT NULL DEFAULT 60,
        created_at        INTEGER NOT NULL,
        updated_at        INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS routine_blocks (
        id                   TEXT PRIMARY KEY,
        routine_id           TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        title                TEXT NOT NULL,
        default_rest_seconds INTEGER NOT NULL DEFAULT 90,
        sort_order           INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_blocks_routine ON routine_blocks(routine_id);

      CREATE TABLE IF NOT EXISTS routine_boulders (
        id                    TEXT PRIMARY KEY,
        block_id              TEXT NOT NULL REFERENCES routine_blocks(id) ON DELETE CASCADE,
        grade_raw             TEXT NOT NULL DEFAULT 'V0',
        normalized_difficulty INTEGER NOT NULL DEFAULT 0,
        target_attempts       INTEGER NOT NULL DEFAULT 1,
        style_tags            TEXT NOT NULL DEFAULT '[]',
        sort_order            INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_boulders_block ON routine_boulders(block_id);
    `);
  }
  runMigrations(_db);
  return _db;
}

function runMigrations(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync('ALTER TABLE boulder_groups ADD COLUMN default_rest_seconds INTEGER NOT NULL DEFAULT 90;');
  } catch {}
  try {
    db.execSync("ALTER TABLE boulder_groups ADD COLUMN notes TEXT NOT NULL DEFAULT '';");
  } catch {}

  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN rpe INTEGER;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN media_uri TEXT;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN media_type TEXT;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN notes TEXT;');
  } catch {}
  try {
    db.execSync("ALTER TABLE boulder_logs ADD COLUMN style_tags TEXT NOT NULL DEFAULT '[]';");
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN failure_reason TEXT;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN crux_timestamp_ms INTEGER;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN hang_time_seconds INTEGER;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_logs ADD COLUMN wall_angle TEXT;');
  } catch {}

  try {
    db.execSync("ALTER TABLE sessions ADD COLUMN title TEXT NOT NULL DEFAULT '';");
  } catch {}
  try {
    db.execSync('ALTER TABLE sessions ADD COLUMN rpe INTEGER;');
  } catch {}
  try {
    db.execSync("ALTER TABLE sessions ADD COLUMN media_uris TEXT NOT NULL DEFAULT '[]';");
  } catch {}
  try {
    db.execSync("ALTER TABLE sessions ADD COLUMN conditions TEXT NOT NULL DEFAULT '[]';");
  } catch {}
  try {
    db.execSync('ALTER TABLE sessions ADD COLUMN skin_state TEXT;');
  } catch {}
  try {
    db.execSync('ALTER TABLE sessions ADD COLUMN finger_fatigue TEXT;');
  } catch {}
  try {
    db.execSync('ALTER TABLE boulder_groups ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0;');
  } catch {}
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase();
  runMigrations(db);
  try {
    const { seedDefaultRoutinesIfEmpty } = require('./routineQueries');
    seedDefaultRoutinesIfEmpty();
  } catch (err) {
    console.error('Failed to seed default routines:', err);
  }
}
