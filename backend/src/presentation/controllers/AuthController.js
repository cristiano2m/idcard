const { loginUser } = require('../../application/use-cases/auth/LoginUser');
const { getCurrentUser } = require('../../application/use-cases/auth/GetCurrentUser');
const { setAuthCookie, clearAuthCookie } = require('../../infrastructure/auth/CookieService');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    const { token, user } = await loginUser({ username, password, ipAddress: ip, userAgent: ua });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Sesión cerrada' });
}

async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me };
