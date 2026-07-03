const { getStatus } = require('../../infrastructure/license/LicenseService');

const EXEMPT = ['/auth', '/license'];

function licenseCheck(req, res, next) {
  if (EXEMPT.some(p => req.path.startsWith(p))) return next();

  const status = getStatus();
  if (status.state === 'inactive' || status.state === 'expired') {
    return res.status(402).json({
      error: {
        code: 'LICENSE_EXPIRED',
        message: 'Licencia no activa o expirada',
        state: status.state,
        expiry: status.expiry,
      },
    });
  }
  if (status.state === 'expiring') {
    res.setHeader('X-License-Warning', `Expira en ${status.daysLeft} día(s) — ${status.expiry}`);
  }
  next();
}

module.exports = licenseCheck;
