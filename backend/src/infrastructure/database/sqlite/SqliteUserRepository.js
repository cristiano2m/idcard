const IUserRepository = require('../../../domain/repositories/IUserRepository');
const User = require('../../../domain/entities/User');
const { getDb } = require('./SqliteConnection');

function toUser(row) {
  if (!row) return null;
  return new User({
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active === 1,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

class SqliteUserRepository extends IUserRepository {
  async create({ username, passwordHash, fullName, role }) {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, passwordHash, fullName, role);
    return this.findById(info.lastInsertRowid);
  }

  async findById(id) {
    return toUser(getDb().prepare('SELECT * FROM users WHERE id = ?').get(id));
  }

  async findByUsername(username) {
    return toUser(getDb().prepare('SELECT * FROM users WHERE username = ?').get(username));
  }

  async update(id, { fullName, role, isActive }) {
    const db = getDb();
    const fields = [], vals = [];
    if (fullName !== undefined) { fields.push('full_name = ?'); vals.push(fullName); }
    if (role !== undefined) { fields.push('role = ?'); vals.push(role); }
    if (isActive !== undefined) { fields.push('is_active = ?'); vals.push(isActive ? 1 : 0); }
    if (!fields.length) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    vals.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    return this.findById(id);
  }

  async delete(id) {
    return getDb().prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
  }

  async list() {
    return getDb().prepare('SELECT * FROM users ORDER BY id').all().map(toUser);
  }

  async updateLastLogin(id) {
    getDb().prepare("UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id);
  }
}

module.exports = SqliteUserRepository;
