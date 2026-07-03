const { getDb } = require('../../infrastructure/database/sqlite/SqliteConnection');

function repo() { return getDb(); }

function upsertUpdate(recordId, equipo, nombre, apellido) {
  repo().prepare(`
    INSERT INTO mdb_updates (record_id, equipo, nombre, apellido, estado, updated_at, printed_at)
    VALUES (?, ?, ?, ?, 'Modificado', datetime('now'), NULL)
    ON CONFLICT(record_id) DO UPDATE SET
      equipo     = excluded.equipo,
      nombre     = excluded.nombre,
      apellido   = excluded.apellido,
      estado     = 'Modificado',
      updated_at = datetime('now'),
      printed_at = NULL
  `).run(recordId, equipo || '', nombre || '', apellido || '');
}

async function list(req, res, next) {
  try {
    const db = repo();
    const modificados = db.prepare("SELECT * FROM mdb_updates WHERE estado = 'Modificado' ORDER BY updated_at DESC").all();
    const impresos    = db.prepare("SELECT * FROM mdb_updates WHERE estado = 'Impreso'    ORDER BY printed_at  DESC").all();
    res.json({ modificados, impresos });
  } catch (err) { next(err); }
}

async function markImpreso(req, res, next) {
  try {
    const { id } = req.params;
    const info = repo().prepare(
      "UPDATE mdb_updates SET estado = 'Impreso', printed_at = datetime('now') WHERE id = ? AND estado = 'Modificado'"
    ).run(Number(id));
    if (!info.changes) return res.status(404).json({ error: 'Registro no encontrado o ya impreso' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, markImpreso, upsertUpdate };
