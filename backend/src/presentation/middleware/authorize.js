const UnauthorizedError = require('../../domain/errors/UnauthorizedError');
const ForbiddenError = require('../../domain/errors/ForbiddenError');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('Sesión requerida'));
    if (!roles.includes(req.user.role)) return next(new ForbiddenError('Permisos insuficientes'));
    next();
  };
}

module.exports = authorize;
