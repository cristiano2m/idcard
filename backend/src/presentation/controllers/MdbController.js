const { listAvailableMdbFiles, getActiveConnectionInfo, setActivePath, getSearchDir, setSearchDir } = require('../../infrastructure/database/mdb/MdbConfigService');
const { importFromMdb } = require('../../application/use-cases/mdb/ImportFromMdb');
const { listMdbRecords } = require('../../application/use-cases/mdb/ListMdbRecords');

function getContext(req) {
  return { userId: req.user?.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

async function listFiles(req, res, next) {
  try {
    const [files, active, searchDir] = await Promise.all([
      listAvailableMdbFiles(),
      getActiveConnectionInfo(),
      getSearchDir(),
    ]);
    res.json({ files, active, searchDir });
  } catch (err) { next(err); }
}

async function updateSearchDir(req, res, next) {
  try {
    const { dir } = req.body;
    const resolved = await setSearchDir(dir);
    const files = await listAvailableMdbFiles();
    res.json({ message: 'Carpeta de búsqueda actualizada', searchDir: resolved, files });
  } catch (err) { next(err); }
}

async function getActive(req, res, next) {
  try { res.json(await getActiveConnectionInfo()); } catch (err) { next(err); }
}

async function setActive(req, res, next) {
  try {
    const { mdbPath, tableName } = req.body;
    const result = await setActivePath(mdbPath, tableName);
    res.json({ message: 'Base de datos activa actualizada', ...result });
  } catch (err) { next(err); }
}

async function importData(req, res, next) {
  try {
    const result = await importFromMdb(getContext(req));
    res.json(result);
  } catch (err) { next(err); }
}

async function records(req, res, next) {
  try {
    const { nombre, page = 1, pageSize = 20 } = req.query;
    const result = await listMdbRecords({ nombre, page: +page, pageSize: +pageSize });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { listFiles, getActive, setActive, updateSearchDir, importData, records };
