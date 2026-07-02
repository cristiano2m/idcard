const ADODB = require('node-adodb');
const path = require('path');
const { getActiveConnectionInfo, getPassword } = require('./MdbConfigService');

// SysNative solo existe para procesos de 32 bits en Windows de 64 bits (bypass WoW64).
// Con Node.js de 64 bits, System32 ya tiene cscript.exe de 64 bits y SysNative no existe.
const ADODB_X64 = process.arch === 'ia32';

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

function deriveEstado(row) {
  if (row.VoidFlag && row.VoidFlag.trim() !== '') return 'Cancelado';
  if (row.PrintCount > 0) return 'Impreso';
  return 'Pendiente';
}

module.exports = { getConnection, getConnectionForPath, listTablesInMdb, deriveEstado };
