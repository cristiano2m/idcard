const { getPersonRepository } = require('../../../infrastructure/database/RepositoryFactory');

async function listPersons({ page, pageSize } = {}) {
  return getPersonRepository().list({ page, pageSize });
}

module.exports = { listPersons };
