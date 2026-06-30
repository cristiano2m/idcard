const DomainError = require('./DomainError');
class UnauthorizedError extends DomainError {
  constructor(message = 'No autorizado') {
    super(message, 'UNAUTHORIZED');
  }
}
module.exports = UnauthorizedError;
