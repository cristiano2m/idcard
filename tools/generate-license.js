#!/usr/bin/env node
/**
 * Generador de códigos de activación para Credenciales PVC.
 *
 * Uso:
 *   node tools/generate-license.js YYYY-MM-DD
 *
 * Requiere:
 *   LICENSE_SECRET en backend/.env
 *
 * Ejemplo:
 *   node tools/generate-license.js 2026-12-31
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse backend/.env without dotenv dependency
const envFile = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
}

const SECRET = process.env.LICENSE_SECRET;
if (!SECRET || SECRET.startsWith('cambia')) {
  console.error('\nERROR: LICENSE_SECRET no está configurado en backend/.env\n');
  process.exit(1);
}

const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('\nUso:  node tools/generate-license.js YYYY-MM-DD');
  console.error('Ej.:  node tools/generate-license.js 2026-12-31\n');
  process.exit(1);
}

const expiryRaw = dateArg.replace(/-/g, '');
const sig = crypto
  .createHmac('sha256', SECRET)
  .update(`IDCARD-${expiryRaw}`)
  .digest('hex')
  .slice(0, 32)
  .toUpperCase();

const code = `IDCARD-${expiryRaw}-${sig}`;

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║        Código de activación generado                ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  ${code}  ║`);
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Válido hasta: ${dateArg}                         ║`);
console.log('╚══════════════════════════════════════════════════════╝\n');
