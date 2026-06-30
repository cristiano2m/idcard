const { validationResult } = require('express-validator');
const ValidationError = require('../../domain/errors/ValidationError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return next(new ValidationError('Datos de entrada inválidos', details));
  }
  next();
}

module.exports = validate;
