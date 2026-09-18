import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('CruxLog.db');
  }
  return db;
}

export function initDatabase() {
  const database = getDatabase();
  
  // CRITICAL: Enable Write-Ahead Logging (WAL) for high-speed concurrent operations
  database.execSync('PRAGMA journal_mode = WAL;');
  database.execSync('PRAGMA foreign_keys = ON;');

  database.execSync(`
    CREATE TABLE IF NOT EXISTS Sessions (
      id TEXT PRIMARY KEY,
      pillar TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      energyScore TEXT,
      skinState TEXT
    );

    CREATE TABLE IF NOT EXISTS Ascents (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      gradeScalar INTEGER NOT NULL,
      status TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      isSynced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (sessionId) REFERENCES Sessions (id) ON DELETE CASCADE
    );
  `);

  console.log('[SQLite] Database initialized. WAL mode active. Schema ready.');
}

// Data Access Layer
export function insertSession(id: string, pillar: string, startTime: number) {
  const database = getDatabase();
  const statement = database.prepareSync('INSERT INTO Sessions (id, pillar, startTime) VALUES (?, ?, ?)');
  statement.executeSync([id, pillar, startTime]);
}

export function updateSessionComplete(id: string, endTime: number, energyScore: string, skinState: string) {
  const database = getDatabase();
  const statement = database.prepareSync('UPDATE Sessions SET endTime = ?, energyScore = ?, skinState = ? WHERE id = ?');
  statement.executeSync([endTime, energyScore, skinState, id]);
}

export function insertAscent(id: string, sessionId: string, gradeScalar: number, status: string, timestamp: number) {
  const database = getDatabase();
  const statement = database.prepareSync('INSERT INTO Ascents (id, sessionId, gradeScalar, status, timestamp, isSynced) VALUES (?, ?, ?, ?, ?, 0)');
  statement.executeSync([id, sessionId, gradeScalar, status, timestamp]);
}

export function getAscentsForSession(sessionId: string): any[] {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM Ascents WHERE sessionId = ? ORDER BY timestamp ASC', [sessionId]);
}
