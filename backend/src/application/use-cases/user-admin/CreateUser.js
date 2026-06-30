const { hash } = require('../../services/PasswordService');
const { getUserRepository } = require('../../../infrastructure/database/RepositoryFactory');
const DuplicateError = require('../../../domain/errors/DuplicateError');

async function createUser({ username, password, fullName, role }) {
  const existing = await getUserRepository().findByUsername(username);
  if (existing) throw new DuplicateError('username', username);
  const passwordHash = await hash(password);
  const user = await getUserRepository().create({ username, passwordHash, fullName, role });
  return user.toPublic();
}

module.exports = { createUser };
