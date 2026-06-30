const bcrypt = require('bcrypt');
const { getDb } = require('../migrations/run-migrations');

async function seedAdminUser() {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (existing) return;

  const hash = await bcrypt.hash('Admin1234!', 12);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES (?, ?, ?, ?)
  `).run('admin', hash, 'Administrador del Sistema', 'Administrador');

  console.log('[seed] Usuario admin creado. Contraseña inicial: Admin1234!');
  console.log('[seed] IMPORTANTE: cambia la contraseña después del primer inicio de sesión.');
}

module.exports = { seedAdminUser };
