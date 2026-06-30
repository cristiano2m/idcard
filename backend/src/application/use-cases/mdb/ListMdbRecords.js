const { getConnection, deriveEstado } = require('../../../infrastructure/database/mdb/MdbQueryHelpers');
const { getActiveConnectionInfo } = require('../../../infrastructure/database/mdb/MdbConfigService');

async function listMdbRecords({ nombre, page = 1, pageSize = 20 } = {}) {
  const conn = await getConnection();
  const { tableName, mdbPath } = await getActiveConnectionInfo();

  let rows = await conn.query(`SELECT * FROM ${tableName}`);

  if (nombre) {
    const needle = nombre.toLowerCase();
    rows = rows.filter(r =>
      (r.FIRST_NAME || '').toLowerCase().includes(needle) ||
      (r.LAST_NAME || '').toLowerCase().includes(needle)
    );
  }

  const total = rows.length;
  const offset = (page - 1) * pageSize;
  const items = rows.slice(offset, offset + pageSize).map(r => ({
    recordId: r.RecordID,
    recordSeq: r.RECORD_,
    nombre: r.FIRST_NAME,
    apellido: r.LAST_NAME,
    equipo: r.TEAM_NAME,
    documentoId: r.I_D_,
    fechaNacimiento: r.D_O_B_,
    fotoPath: r.Photo_1,
    estado: deriveEstado(r),
  }));

  return { items, total, page, pageSize, mdbPath, tableName };
}

module.exports = { listMdbRecords };
