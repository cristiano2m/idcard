const config = require('../config/config');

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.isHttps,
    sameSite: config.sameSitePolicy,
    maxAge: config.cookieMaxAgeMs,
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.isHttps,
    sameSite: config.sameSitePolicy,
  });
}

module.exports = { setAuthCookie, clearAuthCookie };
