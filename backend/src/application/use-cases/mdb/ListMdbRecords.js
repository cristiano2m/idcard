const { getConnection, deriveEstado, MDB_SAFE_COLUMNS } = require('../../../infrastructure/database/mdb/MdbQueryHelpers');
const { getActiveConnectionInfo } = require('../../../infrastructure/database/mdb/MdbConfigService');

function esc(v) { return String(v || '').replace(/'/g, "''"); }

const SORT_COL = {
  nombre:   'FIRST_NAME',
  apellido: 'LAST_NAME',
  equipo:   'TEAM_NAME',
  numero:   'SHIRT_',
  fecha:    'D_O_B_',
  recordId: 'RecordID',
  estado:   'PrintCount',
};

async function listMdbRecords({ nombre, equipo, page = 1, pageSize = 20, sortBy = 'recordId', sortDir = 'ASC' } = {}) {
  const conn = await getConnection();
  const { tableName, mdbPath } = await getActiveConnectionInfo();

  const where = [];
  if (nombre) where.push(`(FIRST_NAME LIKE '%${esc(nombre)}%' OR LAST_NAME LIKE '%${esc(nombre)}%')`);
  if (equipo)  where.push(`TEAM_NAME LIKE '%${esc(equipo)}%'`);

  const col = SORT_COL[sortBy] || 'RecordID';
  const dir = sortDir === 'DESC' ? 'DESC' : 'ASC';
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await conn.query(
    `SELECT ${MDB_SAFE_COLUMNS} FROM ${tableName} ${whereClause} ORDER BY ${col} ${dir}`
  );

  const total = rows.length;
  const offset = (page - 1) * pageSize;
  const items = rows.slice(offset, offset + pageSize).map(r => ({
    recordId:       r.RecordID,
    recordSeq:      r.RECORD_,
    nombre:         r.FIRST_NAME,
    apellido:       r.LAST_NAME,
    equipo:         r.TEAM_NAME,
    numeroCamiseta: r.SHIRT_,
    fechaNacimiento: r.D_O_B_,
    estado:         deriveEstado(r),
  }));

  return { items, total, page, pageSize, mdbPath, tableName };
}

module.exports = { listMdbRecords };
