const IHistoryRepository = require('../../../domain/repositories/IHistoryRepository');
const HistoryEntry = require('../../../domain/entities/HistoryEntry');
const { getDb } = require('./SqliteConnection');

function toEntry(row) {
  if (!row) return null;
  return new HistoryEntry({
    id: row.id,
    personId: row.person_id,
    userId: row.user_id,
    accion: row.accion,
    estadoResultante: row.estado_resultante,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    detalle: row.detalle,
    createdAt: row.created_at,
  });
}

class SqliteHistoryRepository extends IHistoryRepository {
  async record({ personId, userId, accion, estadoResultante, ipAddress, userAgent, detalle }) {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO history (person_id, user_id, accion, estado_resultante, ip_address, user_agent, detalle)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      personId ?? null, userId ?? null, accion,
      estadoResultante ?? null, ipAddress ?? null, userAgent ?? null,
      detalle ? JSON.stringify(detalle) : null
    );
    return toEntry(db.prepare('SELECT * FROM history WHERE id = ?').get(info.lastInsertRowid));
  }

  async listByPerson(personId) {
    return getDb().prepare('SELECT * FROM history WHERE person_id = ? ORDER BY created_at DESC').all(personId).map(toEntry);
  }

  async listAll({ userId, fechaDesde, fechaHasta, accion } = {}, { page = 1, pageSize = 50 } = {}) {
    const db = getDb();
    const where = ['1=1'];
    const vals = [];
    if (userId) { where.push('user_id = ?'); vals.push(userId); }
    if (fechaDesde) { where.push('created_at >= ?'); vals.push(fechaDesde); }
    if (fechaHasta) { where.push('created_at <= ?'); vals.push(fechaHasta + ' 23:59:59'); }
    if (accion) { where.push('accion = ?'); vals.push(accion); }

    const total = db.prepare(`SELECT COUNT(*) AS c FROM history WHERE ${where.join(' AND ')}`).get(...vals).c;
    const offset = (page - 1) * pageSize;
    vals.push(pageSize, offset);
    const items = db.prepare(
      `SELECT h.*, u.username, u.full_name FROM history h
       LEFT JOIN users u ON u.id = h.user_id
       WHERE ${where.join(' AND ')} ORDER BY h.created_at DESC LIMIT ? OFFSET ?`
    ).all(...vals).map(row => ({ ...toEntry(row), username: row.username, userFullName: row.full_name }));

    return { items, total, page, pageSize };
  }
}

module.exports = SqliteHistoryRepository;
