const ADODB = require('node-adodb');
const path = require('path');
const { getActiveConnectionInfo } = require('./MdbConfigService');

async function getConnection() {
  const { mdbPath } = await getActiveConnectionInfo();
  return ADODB.open(
    `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${path.resolve(mdbPath)};`,
    true // usar cscript de 64 bits: el driver ACE OLEDB instalado en este sistema es de 64 bits
  );
}

function deriveEstado(row) {
  if (row.VoidFlag && row.VoidFlag.trim() !== '') return 'Cancelado';
  if (row.PrintCount > 0) return 'Impreso';
  return 'Pendiente';
}

module.exports = { getConnection, deriveEstado };
