const { getPersonRepository } = require('../../../infrastructure/database/RepositoryFactory');

async function getDashboardStats() {
  const repo = getPersonRepository();
  const [counts, recent] = await Promise.all([
    repo.countByStatus(),
    repo.getRecent(10),
  ]);
  return { counts, recent };
}

module.exports = { getDashboardStats };
