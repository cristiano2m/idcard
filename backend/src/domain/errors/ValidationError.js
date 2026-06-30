const DomainError = require('./DomainError');
class ValidationError extends DomainError {
  constructor(message, details = []) {
    super(message, 'VALIDATION_ERROR');
    this.details = details;
  }
}
module.exports = ValidationError;
