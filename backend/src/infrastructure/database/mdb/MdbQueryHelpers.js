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
  try {
    // adSchemaTables = 20, devuelve todas las tablas y vistas
    const rows = await conn.schema(20);
    return rows
      .filter(r => r.TABLE_TYPE === 'TABLE')
      .map(r => r.TABLE_NAME)
      .sort();
  } catch {
    // Fallback: consultar MSysObjects directamente
    try {
      const rows = await conn.query(
        "SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0 ORDER BY Name"
      );
      return rows.map(r => r.Name).filter(Boolean).sort();
    } catch {
      return [];
    }
  }
}

function deriveEstado(row) {
  if (row.VoidFlag && row.VoidFlag.trim() !== '') return 'Cancelado';
  if (row.PrintCount > 0) return 'Impreso';
  return 'Pendiente';
}

module.exports = { getConnection, getConnectionForPath, listTablesInMdb, deriveEstado };
