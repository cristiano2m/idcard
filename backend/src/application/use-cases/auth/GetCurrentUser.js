const { getUserRepository } = require('../../../infrastructure/database/RepositoryFactory');
const NotFoundError = require('../../../domain/errors/NotFoundError');

async function getCurrentUser(userId) {
  const user = await getUserRepository().findById(userId);
  if (!user || !user.isActive) throw new NotFoundError('Usuario', userId);
  return user.toPublic();
}

module.exports = { getCurrentUser };
