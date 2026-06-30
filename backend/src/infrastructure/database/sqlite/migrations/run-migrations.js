const path = require('path');
const fs = require('fs');
const config = require('../../../config/config');

let db;
function getDb() {
  if (!db) {
    const Database = require('better-sqlite3');
    const dir = path.dirname(config.sqlitePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(config.sqlitePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

async function runMigrations() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = __dirname;
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    const already = db.prepare('SELECT filename FROM schema_migrations WHERE filename = ?').get(file);
    if (already) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
    console.log(`[migrate] aplicado: ${file}`);
  }
}

module.exports = { runMigrations, getDb };
