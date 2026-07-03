const crypto = require('crypto');
const { getDb } = require('../database/sqlite/SqliteConnection');

const SETTING_KEY = 'license_code';
const WARNING_DAYS = 7;

function secret() {
  return process.env.LICENSE_SECRET || 'IDCard-default-DO-NOT-USE-IN-PRODUCTION';
}

function sign(expiryRaw) {
  return crypto.createHmac('sha256', secret())
    .update(`IDCARD-${expiryRaw}`)
    .digest('hex')
    .slice(0, 32)
    .toUpperCase();
}

function parseCode(code) {
  const parts = (code || '').trim().toUpperCase().split('-');
  if (parts.length !== 3) return null;
  const [prefix, expiryRaw, sig] = parts;
  if (prefix !== 'IDCARD') return null;
  if (!/^\d{8}$/.test(expiryRaw)) return null;
  if (sig.length !== 32) return null;
  const expiry = `${expiryRaw.slice(0, 4)}-${expiryRaw.slice(4, 6)}-${expiryRaw.slice(6, 8)}`;
  return { expiryRaw, expiry, sig };
}

function validate(code) {
  const parsed = parseCode(code);
  if (!parsed) return { valid: false, reason: 'Formato de código inválido' };
  const expected = sign(parsed.expiryRaw);
  if (parsed.sig !== expected) return { valid: false, reason: 'Código inválido o falsificado' };
  return { valid: true, expiry: parsed.expiry };
}

function getStatus() {
  const db = getDb();
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(SETTING_KEY);
  if (!row) return { state: 'inactive', expiry: null, daysLeft: null };

  const result = validate(row.value);
  if (!result.valid) return { state: 'inactive', expiry: null, daysLeft: null };

  const msLeft = new Date(result.expiry + 'T23:59:59') - Date.now();
  const daysLeft = Math.floor(msLeft / 86400000);

  if (daysLeft < 0) return { state: 'expired', expiry: result.expiry, daysLeft };
  if (daysLeft <= WARNING_DAYS) return { state: 'expiring', expiry: result.expiry, daysLeft };
  return { state: 'active', expiry: result.expiry, daysLeft };
}

function activate(code) {
  const result = validate(code);
  if (!result.valid) throw new Error(result.reason);

  const normalised = code.trim().toUpperCase();
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(SETTING_KEY, normalised);

  return getStatus();
}

module.exports = { validate, getStatus, activate, sign };
