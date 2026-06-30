const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getConnection, deriveEstado } = require('../../../infrastructure/database/mdb/MdbQueryHelpers');
const { getActiveConnectionInfo } = require('../../../infrastructure/database/mdb/MdbConfigService');
const { getDb } = require('../../../infrastructure/database/sqlite/SqliteConnection');
const { getHistoryRepository } = require('../../../infrastructure/database/RepositoryFactory');
const config = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/logging/logger');

function tryCopyPhoto(sourcePath) {
  if (!sourcePath || !sourcePath.trim()) return null;
  try {
    if (!fs.existsSync(sourcePath)) return null;
    const ext = path.extname(sourcePath) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    if (!fs.existsSync(config.photosBaseDir)) fs.mkdirSync(config.photosBaseDir, { recursive: true });
    fs.copyFileSync(sourcePath, path.join(config.photosBaseDir, filename));
    return path.join('photos', filename);
  } catch (err) {
    logger.warn(`No se pudo copiar foto desde ${sourcePath}: ${err.message}`);
    return null;
  }
}

async function importFromMdb({ userId, ipAddress, userAgent } = {}) {
  const conn = await getConnection();
  const { tableName } = await getActiveConnectionInfo();
  const db = getDb();

  const rows = await conn.query(`SELECT * FROM ${tableName}`);

  const findExisting = db.prepare('SELECT id, foto_path FROM persons WHERE mdb_record_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO persons (
      mdb_record_id, nombre, apellido, equipo, documento_id, fecha_nacimiento, numero_camiseta,
      foto_path, firma_path, estado, qr_value, barcode_value
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const updateStmt = db.prepare(`
    UPDATE persons SET nombre=?, apellido=?, equipo=?, documento_id=?, fecha_nacimiento=?, numero_camiseta=?,
      foto_path=COALESCE(?, foto_path), firma_path=COALESCE(?, firma_path), estado=?, updated_at=datetime('now')
    WHERE id=?
  `);

  let created = 0, updated = 0, skipped = 0;
  const errors = [];

  for (const row of rows) {
    try {
      const recordId = row.RecordID;
      const documentoId = (row.I_D_ && row.I_D_.trim()) || `MDB-${recordId}`;
      const equipo = (row.TEAM_NAME && row.TEAM_NAME.trim()) || 'Sin equipo';
      const numeroCamiseta = row.SHIRT_ || null;
      const estado = deriveEstado(row);
      const existing = findExisting.get(recordId);

      if (existing) {
        const newFotoPath = !existing.foto_path ? tryCopyPhoto(row.Photo_1) : null;
        updateStmt.run(
          row.FIRST_NAME || '', row.LAST_NAME || '', equipo, documentoId, row.D_O_B_ || '', numeroCamiseta,
          newFotoPath, null, estado, existing.id
        );
        updated++;
      } else {
        const fotoPath = tryCopyPhoto(row.Photo_1);
        const firmaPath = tryCopyPhoto(row.SIGNATURE);
        insertStmt.run(
          recordId, row.FIRST_NAME || '', row.LAST_NAME || '', equipo, documentoId,
          row.D_O_B_ || '', numeroCamiseta, fotoPath, firmaPath, estado, documentoId, documentoId
        );
        created++;
      }
    } catch (err) {
      skipped++;
      errors.push({ recordId: row.RecordID, message: err.message });
    }
  }

  await getHistoryRepository().record({
    userId, accion: 'IMPORT_FROM_MDB', ipAddress, userAgent,
    detalle: { tableName, total: rows.length, created, updated, skipped },
  });

  logger.info(`Import MDB: ${created} creados, ${updated} actualizados, ${skipped} con error (de ${rows.length})`);

  return { total: rows.length, created, updated, skipped, errors: errors.slice(0, 20) };
}

module.exports = { importFromMdb };
