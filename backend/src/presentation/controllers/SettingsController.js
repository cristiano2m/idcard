const { getSettingsRepository } = require('../../infrastructure/database/RepositoryFactory');

async function getAll(req, res, next) {
  try { res.json({ settings: await getSettingsRepository().getAll() }); } catch (err) { next(err); }
}

async function set(req, res, next) {
  try {
    await getSettingsRepository().set(req.body.key, req.body.value);
    res.json({ message: 'Configuración actualizada' });
  } catch (err) { next(err); }
}

module.exports = { getAll, set };
