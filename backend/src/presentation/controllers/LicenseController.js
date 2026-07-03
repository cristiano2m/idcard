const { getStatus, activate } = require('../../infrastructure/license/LicenseService');

async function status(req, res, next) {
  try {
    res.json(getStatus());
  } catch (err) { next(err); }
}

async function activateLicense(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: { message: 'Código requerido' } });
    }
    const result = activate(code);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

module.exports = { status, activateLicense };
