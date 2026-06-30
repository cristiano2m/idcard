const DomainError = require('./DomainError');
class NotFoundError extends DomainError {
  constructor(resource, id) {
    super(`${resource} con id '${id}' no encontrado`, 'NOT_FOUND');
  }
}
module.exports = NotFoundError;
