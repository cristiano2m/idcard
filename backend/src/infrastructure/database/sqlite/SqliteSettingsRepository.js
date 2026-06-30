const ISettingsRepository = require('../../../domain/repositories/ISettingsRepository');
const { getDb } = require('./SqliteConnection');

class SqliteSettingsRepository extends ISettingsRepository {
  async get(key) {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  async set(key, value) {
    getDb().prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  async getAll() {
    const rows = getDb().prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
}

module.exports = SqliteSettingsRepository;
