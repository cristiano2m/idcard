const DomainError = require('./DomainError');
class ForbiddenError extends DomainError {
  constructor(message = 'Permisos insuficientes') {
    super(message, 'FORBIDDEN');
  }
}
module.exports = ForbiddenError;
