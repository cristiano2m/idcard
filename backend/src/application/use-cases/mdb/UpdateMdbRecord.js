const { getConnection, MDB_SAFE_COLUMNS } = require('../../../infrastructure/database/mdb/MdbQueryHelpers');
const { getActiveConnectionInfo } = require('../../../infrastructure/database/mdb/MdbConfigService');

function esc(v) {
  return (v == null ? '' : String(v)).replace(/'/g, "''");
}

function toAccessDate(val) {
  if (!val) return 'Null';
  const dateStr = String(val).includes('T') ? String(val).split('T')[0] : String(val);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Null';
  return `#${dateStr}#`;
}

async function updateMdbRecord(recordId, data) {
  const conn = await getConnection();
  const { tableName } = await getActiveConnectionInfo();

  const sets = [];
  if (data.FIRST_NAME !== undefined) sets.push(`FIRST_NAME = '${esc(data.FIRST_NAME)}'`);
  if (data.LAST_NAME  !== undefined) sets.push(`LAST_NAME = '${esc(data.LAST_NAME)}'`);
  if (data.TEAM_NAME  !== undefined) sets.push(`TEAM_NAME = '${esc(data.TEAM_NAME)}'`);
  if (data.D_O_B_     !== undefined) sets.push(`D_O_B_ = ${toAccessDate(data.D_O_B_)}`);
  if (data.SHIRT_     !== undefined) sets.push(`SHIRT_ = ${Number(data.SHIRT_) || 0}`);

  if (!sets.length) throw new Error('No hay campos para actualizar');

  await conn.execute(
    `UPDATE ${tableName} SET ${sets.join(', ')} WHERE RecordID = ${Number(recordId)}`
  );

  const rows = await conn.query(
    `SELECT ${MDB_SAFE_COLUMNS} FROM ${tableName} WHERE RecordID = ${Number(recordId)}`
  );
  return rows[0] || null;
}

module.exports = { updateMdbRecord };
