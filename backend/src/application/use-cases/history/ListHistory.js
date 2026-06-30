const { getHistoryRepository } = require('../../../infrastructure/database/RepositoryFactory');

async function listHistory(filters, pagination) {
  return getHistoryRepository().listAll(filters, pagination);
}

module.exports = { listHistory };
