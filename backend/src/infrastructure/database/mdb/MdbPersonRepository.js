const path = require('path');
const config = require('../../config/config');
const IPersonRepository = require('../../../domain/repositories/IPersonRepository');
const Person = require('../../../domain/entities/Person');
const { getDb } = require('../sqlite/SqliteConnection');
const { getActiveConnectionInfo } = require('./MdbConfigService');
const { getConnection, deriveEstado, MDB_SAFE_COLUMNS } = require('./MdbQueryHelpers');

function esc(v) {
  return (v || '').toString().replace(/'/g, "''");
}

function toAbsolutePhotoPath(fotoPath) {
  return fotoPath && config.photosAbsoluteBasePath
    ? path.join(config.photosAbsoluteBasePath, path.basename(fotoPath))
    : (fotoPath || '');
}

function toAbsoluteSignaturePath(firmaPath) {
  return firmaPath && config.photosAbsoluteBasePath
    ? path.join(config.photosAbsoluteBasePath.replace('photos', 'signatures'), path.basename(firmaPath))
    : (firmaPath || '');
}

class MdbPersonRepository extends IPersonRepository {
  async create(data) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    const sqliteRepo = new SqlitePersonRepository();
    const person = await sqliteRepo.create(data);

    const sqliteDb = getDb();
    const conn = await getConnection();
    const { tableName } = await getActiveConnectionInfo();

    try {
      const maxRow = await conn.query(`SELECT MAX(RecordID) AS maxId, MAX(RECORD_) AS maxRec FROM ${tableName}`);
      const maxId = (maxRow[0]?.maxId || 0) + 1;
      const maxRec = (maxRow[0]?.maxRec || 0) + 1;

      const photoAbsPath = toAbsolutePhotoPath(person.fotoPath);
      const firmaAbsPath = toAbsoluteSignaturePath(person.firmaPath);

      await conn.execute(`
        INSERT INTO ${tableName}
          (RecordID, RECORD_, FIRST_NAME, LAST_NAME, TEAM_NAME, I_D_, D_O_B_,
           Photo_1, SIGNATURE, SHIRT_, PrintCount, PrintDateTime, PrintBy, VoidFlag, VoidDateTime, VoidBy)
        VALUES (${maxId}, ${maxRec},
          '${esc(person.nombre)}', '${esc(person.apellido)}', '${esc(person.equipo)}',
          '${esc(person.documentoId)}', '${esc(person.fechaNacimiento)}',
          '${esc(photoAbsPath)}', '${esc(firmaAbsPath)}',
          ${Number(person.numeroCamiseta) || 0}, 0, '', '', '', '', '')
      `);

      sqliteDb.prepare("UPDATE persons SET mdb_record_id = ? WHERE id = ?").run(maxId, person.id);
      person.mdbRecordId = maxId;
    } catch (mdbErr) {
      require('../../logging/logger').error(`MDB insert failed for person ${person.id}: ${mdbErr.message}`);
    }

    return person;
  }

  async findById(id) {
    const sqliteDb = getDb();
    const row = sqliteDb.prepare('SELECT * FROM persons WHERE id = ? AND deleted_at IS NULL').get(id);
    if (!row) return null;

    if (row.mdb_record_id) {
      try {
        const conn = await getConnection();
        const { tableName } = await getActiveConnectionInfo();
        const mdbRows = await conn.query(`SELECT ${MDB_SAFE_COLUMNS} FROM ${tableName} WHERE RecordID = ${row.mdb_record_id}`);
        if (mdbRows[0]) {
          row.estado = deriveEstado(mdbRows[0]);
          sqliteDb.prepare("UPDATE persons SET estado = ? WHERE id = ?").run(row.estado, id);
        }
      } catch {}
    }

    return new Person({
      id: row.id, mdbRecordId: row.mdb_record_id,
      nombre: row.nombre, apellido: row.apellido, equipo: row.equipo,
      documentoId: row.documento_id, fechaNacimiento: row.fecha_nacimiento,
      numeroCamiseta: row.numero_camiseta,
      fotoPath: row.foto_path, firmaPath: row.firma_path,
      qrPath: row.qr_path, qrValue: row.qr_value, barcodeValue: row.barcode_value,
      estado: row.estado, createdByUserId: row.created_by_user_id,
      createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at,
    });
  }

  async findByDocumentId(documentoId) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().findByDocumentId(documentoId);
  }

  async update(id, partialData) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    const sqliteRepo = new SqlitePersonRepository();
    const person = await sqliteRepo.update(id, partialData);

    if (!person.mdbRecordId) {
      require('../../logging/logger').warn(`Persona ${id} no tiene mdb_record_id; edición no sincronizada al MDB`);
      return person;
    }

    try {
      const conn = await getConnection();
      const { tableName } = await getActiveConnectionInfo();

      const sets = [];
      if (partialData.nombre !== undefined) sets.push(`FIRST_NAME = '${esc(person.nombre)}'`);
      if (partialData.apellido !== undefined) sets.push(`LAST_NAME = '${esc(person.apellido)}'`);
      if (partialData.equipo !== undefined) sets.push(`TEAM_NAME = '${esc(person.equipo)}'`);
      if (partialData.documentoId !== undefined) sets.push(`I_D_ = '${esc(person.documentoId)}'`);
      if (partialData.fechaNacimiento !== undefined) sets.push(`D_O_B_ = '${esc(person.fechaNacimiento)}'`);
      if (partialData.numeroCamiseta !== undefined) sets.push(`SHIRT_ = ${Number(person.numeroCamiseta) || 0}`);
      if (partialData.fotoPath !== undefined) sets.push(`Photo_1 = '${esc(toAbsolutePhotoPath(person.fotoPath))}'`);
      if (partialData.firmaPath !== undefined) sets.push(`SIGNATURE = '${esc(toAbsoluteSignaturePath(person.firmaPath))}'`);

      if (sets.length) {
        await conn.execute(`UPDATE ${tableName} SET ${sets.join(', ')} WHERE RecordID = ${person.mdbRecordId}`);
      }
    } catch (mdbErr) {
      require('../../logging/logger').error(`MDB update failed for person ${id} (RecordID ${person.mdbRecordId}): ${mdbErr.message}`);
    }

    return person;
  }

  async softDelete(id) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().softDelete(id);
  }

  async changeStatus(id, nuevoEstado) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().changeStatus(id, nuevoEstado);
  }

  async list(opts) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().list(opts);
  }

  async search(filters, opts) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().search(filters, opts);
  }

  async countByStatus() {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().countByStatus();
  }

  async getRecent(limit) {
    const SqlitePersonRepository = require('../sqlite/SqlitePersonRepository');
    return new SqlitePersonRepository().getRecent(limit);
  }
}

module.exports = MdbPersonRepository;
