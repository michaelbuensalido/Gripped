const Database = require('better-sqlite3');

class SQLiteDatabase {
  constructor(name) {
    this.db = new Database(':memory:');
  }
  execSync(sql) {
    this.db.exec(sql);
  }
  runSync(sql, args = []) {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...args);
    return { lastInsertRowId: info.lastInsertRowid, changes: info.changes };
  }
  getAllSync(sql, args = []) {
    return this.db.prepare(sql).all(...args);
  }
  getFirstSync(sql, args = []) {
    return this.db.prepare(sql).get(...args);
  }
}

module.exports = {
  openDatabaseSync: (name) => new SQLiteDatabase(name)
};
