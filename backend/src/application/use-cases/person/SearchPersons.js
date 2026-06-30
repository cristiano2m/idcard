const { getPersonRepository } = require('../../../infrastructure/database/RepositoryFactory');

async function searchPersons(filters, pagination) {
  return getPersonRepository().search(filters, pagination);
}

module.exports = { searchPersons };
