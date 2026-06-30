const { getPersonRepository } = require('../../../infrastructure/database/RepositoryFactory');
const NotFoundError = require('../../../domain/errors/NotFoundError');

async function getPersonById(id) {
  const person = await getPersonRepository().findById(id);
  if (!person) throw new NotFoundError('Persona', id);
  return person;
}

module.exports = { getPersonById };
