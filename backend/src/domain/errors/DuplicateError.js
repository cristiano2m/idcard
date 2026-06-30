const DomainError = require('./DomainError');
class DuplicateError extends DomainError {
  constructor(field, value) {
    super(`Ya existe un registro con ${field} = '${value}'`, 'DUPLICATE');
    this.field = field;
  }
}
module.exports = DuplicateError;
