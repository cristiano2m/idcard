const { listAvailableMdbFiles, getActiveConnectionInfo, setActivePath, getSearchDir, setSearchDir, setPassword } = require('../../infrastructure/database/mdb/MdbConfigService');
const { listTablesInMdb, getConnection, MDB_SAFE_COLUMNS } = require('../../infrastructure/database/mdb/MdbQueryHelpers');
const { importFromMdb } = require('../../application/use-cases/mdb/ImportFromMdb');
const { listMdbRecords } = require('../../application/use-cases/mdb/ListMdbRecords');
const { updateMdbRecord } = require('../../application/use-cases/mdb/UpdateMdbRecord');
const { upsertUpdate } = require('./MdbUpdatesController');

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
    const { nombre, equipo, page = 1, pageSize = 20, sortBy, sortDir } = req.query;
    const result = await listMdbRecords({ nombre, equipo, page: +page, pageSize: +pageSize, sortBy, sortDir });
    res.json(result);
  } catch (err) { next(err); }
}

async function listTeams(req, res, next) {
  try {
    const conn = await getConnection();
    const { tableName } = await getActiveConnectionInfo();
    const rows = await conn.query(
      `SELECT DISTINCT TEAM_NAME FROM ${tableName} WHERE TEAM_NAME IS NOT NULL ORDER BY TEAM_NAME ASC`
    );
    const teams = rows.map(r => r.TEAM_NAME).filter(Boolean);
    res.json({ teams });
  } catch (err) { next(err); }
}

async function listTables(req, res, next) {
  try {
    const { mdbPath } = req.query;
    if (!mdbPath) return res.status(400).json({ error: 'mdbPath requerido' });
    const tables = await listTablesInMdb(mdbPath);
    res.json({ tables });
  } catch (err) { next(err); }
}

async function updatePassword(req, res, next) {
  try {
    const { password } = req.body;
    await setPassword(password || '');
    res.json({ message: password ? 'Contraseña guardada' : 'Contraseña eliminada' });
  } catch (err) { next(err); }
}

async function getRecord(req, res, next) {
  try {
    const conn = await getConnection();
    const { tableName } = await getActiveConnectionInfo();
    const rows = await conn.query(
      `SELECT ${MDB_SAFE_COLUMNS} FROM ${tableName} WHERE RecordID = ${Number(req.params.recordId)}`
    );
    if (!rows.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ record: rows[0] });
  } catch (err) { next(err); }
}

async function updateRecord(req, res, next) {
  try {
    await updateMdbRecord(Number(req.params.recordId), req.body);
    upsertUpdate(
      Number(req.params.recordId),
      req.body.TEAM_NAME,
      req.body.FIRST_NAME,
      req.body.LAST_NAME,
      req.body.SHIRT_
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listFiles, getActive, setActive, listTables, listTeams, updateSearchDir, updatePassword, importData, records, getRecord, updateRecord };
