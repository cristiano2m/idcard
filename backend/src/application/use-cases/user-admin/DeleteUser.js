const { getUserRepository } = require('../../../infrastructure/database/RepositoryFactory');
const NotFoundError = require('../../../domain/errors/NotFoundError');

async function deleteUser(id) {
  const ok = await getUserRepository().delete(id);
  if (!ok) throw new NotFoundError('Usuario', id);
}

module.exports = { deleteUser };
