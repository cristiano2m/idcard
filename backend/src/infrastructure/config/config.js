const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const env = process.env.NODE_ENV || 'development';

function loadJson(file) {
  try { return require(file); } catch { return {}; }
}

const configDir = path.resolve(__dirname, '../../../../config');
const base = loadJson(`${configDir}/default.json`);
const envConfig = loadJson(`${configDir}/${env}.json`);

const merged = { ...base, ...envConfig };

const config = Object.freeze({
  env,
  port: Number(process.env.PORT) || merged.port,
  dbDriver: process.env.DB_DRIVER || merged.dbDriver,

  sqlitePath: process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.resolve(__dirname, '../../../', merged.sqlitePath),
  mdbPath: process.env.MDB_PATH
    ? path.resolve(process.env.MDB_PATH)
    : path.resolve(__dirname, '../../../', merged.mdbPath),
  mdbTableName: process.env.MDB_TABLE_NAME || merged.mdbTableName,

  photosBaseDir: path.resolve(__dirname, '../../../', merged.photosBaseDir),
  signaturesBaseDir: path.resolve(__dirname, '../../../', merged.signaturesBaseDir),
  photosAbsoluteBasePath: process.env.PHOTOS_ABSOLUTE_BASE_PATH || merged.photosAbsoluteBasePath || '',

  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production_please',
  jwtExpiresIn: merged.jwtExpiresIn,
  cookieMaxAgeMs: merged.cookieMaxAgeMs,

  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : merged.corsOrigins,

  isHttps: process.env.IS_HTTPS === 'true' ? true : process.env.IS_HTTPS === 'false' ? false : merged.isHttps,
  sameSitePolicy: process.env.SAME_SITE_POLICY || merged.sameSitePolicy,
  uploadMaxSizeBytes: merged.uploadMaxSizeBytes,
  logLevel: merged.logLevel,
  logDir: path.resolve(__dirname, '../../../../logs'),
});

module.exports = config;
