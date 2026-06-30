const { verify } = require('../../infrastructure/auth/JwtService');
const UnauthorizedError = require('../../domain/errors/UnauthorizedError');

function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next(new UnauthorizedError('Sesión requerida'));
  try {
    req.user = verify(token);
    next();
  } catch {
    next(new UnauthorizedError('Sesión inválida o expirada'));
  }
}

module.exports = authenticate;
