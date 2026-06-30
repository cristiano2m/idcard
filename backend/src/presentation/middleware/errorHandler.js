const logger = require('../../infrastructure/logging/logger');
const DomainError = require('../../domain/errors/DomainError');
const ValidationError = require('../../domain/errors/ValidationError');
const NotFoundError = require('../../domain/errors/NotFoundError');
const DuplicateError = require('../../domain/errors/DuplicateError');
const UnauthorizedError = require('../../domain/errors/UnauthorizedError');
const ForbiddenError = require('../../domain/errors/ForbiddenError');

const statusMap = new Map([
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [NotFoundError, 404],
  [DuplicateError, 409],
]);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  for (const [Cls, code] of statusMap) {
    if (err instanceof Cls) { status = code; break; }
  }

  if (status === 500) logger.error(err);

  const body = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Error interno del servidor',
    },
  };

  if (err instanceof ValidationError && err.details?.length) {
    body.error.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
