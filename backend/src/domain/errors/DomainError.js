class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || this.constructor.name;
  }
}
module.exports = DomainError;
