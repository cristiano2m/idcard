const { getUserRepository } = require('../../../infrastructure/database/RepositoryFactory');
const { hash } = require('../../services/PasswordService');
const NotFoundError = require('../../../domain/errors/NotFoundError');

async function updateUser(id, { fullName, role, isActive, newPassword }) {
  const user = await getUserRepository().findById(id);
  if (!user) throw new NotFoundError('Usuario', id);
  const data = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;
  if (newPassword) data.passwordHash = await hash(newPassword);
  return (await getUserRepository().update(id, data)).toPublic();
}

module.exports = { updateUser };
