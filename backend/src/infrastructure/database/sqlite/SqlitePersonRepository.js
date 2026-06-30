const IPersonRepository = require('../../../domain/repositories/IPersonRepository');
const Person = require('../../../domain/entities/Person');
const { getDb } = require('./SqliteConnection');

function toPerson(row) {
  if (!row) return null;
  return new Person({
    id: row.id,
    mdbRecordId: row.mdb_record_id,
    nombre: row.nombre,
    apellido: row.apellido,
    equipo: row.equipo,
    documentoId: row.documento_id,
    fechaNacimiento: row.fecha_nacimiento,
    numeroCamiseta: row.numero_camiseta,
    fotoPath: row.foto_path,
    firmaPath: row.firma_path,
    qrPath: row.qr_path,
    qrValue: row.qr_value,
    barcodeValue: row.barcode_value,
    estado: row.estado,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}

class SqlitePersonRepository extends IPersonRepository {
  async create(data) {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO persons (
        nombre, apellido, equipo, documento_id, fecha_nacimiento, numero_camiseta,
        foto_path, firma_path, qr_path, qr_value, barcode_value, estado, created_by_user_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      data.nombre, data.apellido, data.equipo, data.documentoId,
      data.fechaNacimiento ?? null, data.numeroCamiseta ?? null,
      data.fotoPath ?? null, data.firmaPath ?? null,
      data.qrPath ?? null, data.qrValue ?? null, data.barcodeValue ?? null,
      data.estado ?? 'Pendiente', data.createdByUserId ?? null
    );
    return toPerson(db.prepare('SELECT * FROM persons WHERE id = ?').get(info.lastInsertRowid));
  }

  async findById(id) {
    return toPerson(getDb().prepare('SELECT * FROM persons WHERE id = ? AND deleted_at IS NULL').get(id));
  }

  async findByDocumentId(documentoId) {
    return toPerson(getDb().prepare('SELECT * FROM persons WHERE documento_id = ? AND deleted_at IS NULL').get(documentoId));
  }

  async update(id, data) {
    const db = getDb();
    const fields = [], vals = [];
    const map = {
      nombre: 'nombre', apellido: 'apellido', equipo: 'equipo', documentoId: 'documento_id',
      fechaNacimiento: 'fecha_nacimiento', numeroCamiseta: 'numero_camiseta',
      fotoPath: 'foto_path', firmaPath: 'firma_path',
      qrPath: 'qr_path', qrValue: 'qr_value', barcodeValue: 'barcode_value',
      mdbRecordId: 'mdb_record_id',
    };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) { fields.push(`${col} = ?`); vals.push(data[key]); }
    }
    if (!fields.length) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    vals.push(id);
    db.prepare(`UPDATE persons SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    return this.findById(id);
  }

  async softDelete(id) {
    return getDb().prepare("UPDATE persons SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL").run(id).changes > 0;
  }

  async changeStatus(id, nuevoEstado) {
    getDb().prepare("UPDATE persons SET estado = ?, updated_at = datetime('now') WHERE id = ?").run(nuevoEstado, id);
    return this.findById(id);
  }

  async list({ page = 1, pageSize = 20 } = {}) {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) AS c FROM persons WHERE deleted_at IS NULL').get().c;
    const offset = (page - 1) * pageSize;
    const items = db.prepare('SELECT * FROM persons WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(pageSize, offset).map(toPerson);
    return { items, total, page, pageSize };
  }

  async search(filters = {}, { page = 1, pageSize = 20 } = {}) {
    const db = getDb();
    const where = ['deleted_at IS NULL'];
    const vals = [];
    if (filters.nombre) { where.push("(nombre LIKE ? OR apellido LIKE ?)"); vals.push(`%${filters.nombre}%`, `%${filters.nombre}%`); }
    if (filters.equipo) { where.push('equipo LIKE ?'); vals.push(`%${filters.equipo}%`); }
    if (filters.documentoId) { where.push('documento_id LIKE ?'); vals.push(`%${filters.documentoId}%`); }
    if (filters.estado) { where.push('estado = ?'); vals.push(filters.estado); }
    if (filters.fechaDesde) { where.push('created_at >= ?'); vals.push(filters.fechaDesde); }
    if (filters.fechaHasta) { where.push('created_at <= ?'); vals.push(filters.fechaHasta + ' 23:59:59'); }

    const clause = where.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) AS c FROM persons WHERE ${clause}`).get(...vals).c;
    const offset = (page - 1) * pageSize;
    const items = db.prepare(`SELECT * FROM persons WHERE ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...vals, pageSize, offset).map(toPerson);
    return { items, total, page, pageSize };
  }

  async countByStatus() {
    const db = getDb();
    const rows = db.prepare("SELECT estado, COUNT(*) AS c FROM persons WHERE deleted_at IS NULL GROUP BY estado").all();
    const result = { Pendiente: 0, Impreso: 0, Cancelado: 0, total: 0 };
    for (const r of rows) { result[r.estado] = r.c; result.total += r.c; }
    return result;
  }

  async getRecent(limit = 10) {
    return getDb().prepare('SELECT * FROM persons WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?')
      .all(limit).map(toPerson);
  }
}

module.exports = SqlitePersonRepository;
