const { getUserRepository } = require('../../../infrastructure/database/RepositoryFactory');

async function listUsers() {
  const users = await getUserRepository().list();
  return users.map(u => u.toPublic());
}

module.exports = { listUsers };
