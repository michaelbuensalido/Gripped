import * as SQLite from 'expo-sqlite';
import { seedDefaultRoutinesIfEmpty } from './routineQueries';

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
        id          TEXT PRIMARY KEY,
        session_id  TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        zone_name   TEXT    NOT NULL DEFAULT 'Main Wall',
        sort_order  INTEGER NOT NULL DEFAULT 0
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
        timestamp             INTEGER NOT NULL
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

    /* Migration: add rpe column if upgrading from an older build */
    try {
      _db.execSync(`ALTER TABLE boulder_logs ADD COLUMN rpe INTEGER;`);
    } catch {
      // Column already exists — safe to ignore
    }
  }
  return _db;
}

export async function initializeDatabase(): Promise<void> {
  getDatabase();
  try {
    seedDefaultRoutinesIfEmpty();
  } catch (err) {
    console.error('Failed to seed default routines:', err);
  }
}
