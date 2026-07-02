const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const { getSettingsRepository } = require('../RepositoryFactory');

const DEFAULT_SEARCH_DIR = path.dirname(config.mdbPath);

async function getSearchDir() {
  const settings = getSettingsRepository();
  const saved = await settings.get('mdb_search_dir');
  return saved || DEFAULT_SEARCH_DIR;
}

async function setSearchDir(dir) {
  const resolved = path.resolve(dir);
  if (!fs.existsSync(resolved)) throw new Error(`Carpeta no encontrada: ${resolved}`);
  if (!fs.statSync(resolved).isDirectory()) throw new Error(`La ruta no es una carpeta: ${resolved}`);
  const settings = getSettingsRepository();
  await settings.set('mdb_search_dir', resolved);
  return resolved;
}

async function getPassword() {
  const settings = getSettingsRepository();
  return (await settings.get('mdb_password')) || '';
}

async function setPassword(password) {
  const settings = getSettingsRepository();
  await settings.set('mdb_password', password || '');
}

async function getActiveConnectionInfo() {
  const settings = getSettingsRepository();
  const activePath = await settings.get('mdb_active_path');
  const activeTable = await settings.get('mdb_active_table');
  const password = await settings.get('mdb_password');
  return {
    mdbPath: activePath || config.mdbPath,
    tableName: activeTable || config.mdbTableName,
    hasPassword: !!(password && password.length > 0),
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

async function listAvailableMdbFiles() {
  const dir = await getSearchDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.mdb$/i.test(f))
    .map(f => {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        return {
          name: f,
          path: full,
          sizeMB: +(stat.size / (1024 * 1024)).toFixed(1),
          modifiedAt: stat.mtime.toISOString(),
        };
      } catch { return null; }
    })
    .filter(Boolean);
}

module.exports = { getActiveConnectionInfo, setActivePath, listAvailableMdbFiles, getSearchDir, setSearchDir, getPassword, setPassword, DEFAULT_SEARCH_DIR };
