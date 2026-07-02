const ADODB = require('node-adodb');
const path = require('path');
const { getActiveConnectionInfo, getPassword } = require('./MdbConfigService');

// node-adodb engine.js: x64=true → System32\cscript.exe (64-bit)
//                       x64=false → SysWOW64\cscript.exe (32-bit, no encuentra ACE OLEDB 64-bit)
// Este sistema tiene el driver Microsoft.ACE.OLEDB.12.0 de 64 bits, siempre usar x64=true.
const ADODB_X64 = true;

function buildConnectionString(mdbPath, password) {
  const passwordPart = password ? `Jet OLEDB:Database Password=${password};` : '';
  return `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${path.resolve(mdbPath)};${passwordPart}`;
}

async function getConnection() {
  const { mdbPath } = await getActiveConnectionInfo();
  const password = await getPassword();
  return ADODB.open(buildConnectionString(mdbPath, password), ADODB_X64);
}

async function getConnectionForPath(mdbPath) {
  const password = await getPassword();
  return ADODB.open(buildConnectionString(mdbPath, password), ADODB_X64);
}

async function listTablesInMdb(mdbPath) {
  const conn = await getConnectionForPath(mdbPath);
  let lastError;

  // Intento 1: schema ADO (adSchemaTables = 20)
  try {
    const rows = await conn.schema(20);
    const tables = rows
      .filter(r => r.TABLE_TYPE === 'TABLE')
      .map(r => r.TABLE_NAME)
      .sort();
    if (tables.length > 0) return tables;
  } catch (e) { lastError = e; }

  // Intento 2: MSysObjects (tabla de sistema de Access)
  try {
    const rows = await conn.query(
      'SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0 ORDER BY Name'
    );
    const tables = rows.map(r => r.Name).filter(Boolean).sort();
    if (tables.length > 0) return tables;
  } catch (e) { lastError = e; }

  // Si ambos fallan, lanzar el error para que el frontend lo muestre
  throw new Error(
    `No se pudieron leer las tablas del archivo MDB. ` +
    `Ingresa el nombre de la tabla manualmente. ` +
    `(Detalle: ${lastError ? lastError.message : 'sin detalle'})`
  );
}

// Safe columns for SELECT — excludes Photo_1 (binary OLE in some MDB schemas)
const MDB_SAFE_COLUMNS = 'RecordID, RECORD_, FIRST_NAME, LAST_NAME, TEAM_NAME, I_D_, D_O_B_, SHIRT_, PrintCount, VoidFlag';

function deriveEstado(row) {
  // VoidFlag may be boolean (some MDB schemas) or a string
  const voided = row.VoidFlag === true || row.VoidFlag === 1 ||
    (typeof row.VoidFlag === 'string' && row.VoidFlag.trim() !== '');
  if (voided) return 'Cancelado';
  if (row.PrintCount > 0) return 'Impreso';
  return 'Pendiente';
}

module.exports = { getConnection, getConnectionForPath, listTablesInMdb, deriveEstado, MDB_SAFE_COLUMNS };
