const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const { getSettingsRepository } = require('../RepositoryFactory');

const MDB_BASE_DIR = path.dirname(config.mdbPath);

async function getActiveConnectionInfo() {
  const settings = getSettingsRepository();
  const activePath = await settings.get('mdb_active_path');
  const activeTable = await settings.get('mdb_active_table');
  return {
    mdbPath: activePath || config.mdbPath,
    tableName: activeTable || config.mdbTableName,
  };
}

async function setActivePath(mdbPath, tableName) {
  const resolved = path.resolve(mdbPath);
  if (!fs.existsSync(resolved)) throw new Error(`Archivo no encontrado: ${resolved}`);
  if (!/\.mdb$/i.test(resolved)) throw new Error('El archivo debe tener extensión .mdb');

  const settings = getSettingsRepository();
  await settings.set('mdb_active_path', resolved);
  if (tableName) await settings.set('mdb_active_table', tableName);
  return { mdbPath: resolved, tableName: tableName || config.mdbTableName };
}

function listAvailableMdbFiles() {
  if (!fs.existsSync(MDB_BASE_DIR)) return [];
  return fs.readdirSync(MDB_BASE_DIR)
    .filter(f => /\.mdb$/i.test(f))
    .map(f => {
      const full = path.join(MDB_BASE_DIR, f);
      const stat = fs.statSync(full);
      return {
        name: f,
        path: full,
        sizeMB: +(stat.size / (1024 * 1024)).toFixed(1),
        modifiedAt: stat.mtime.toISOString(),
      };
    });
}

module.exports = { getActiveConnectionInfo, setActivePath, listAvailableMdbFiles, MDB_BASE_DIR };
