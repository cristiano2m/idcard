const { getPersonRepository, getHistoryRepository } = require('../../../infrastructure/database/RepositoryFactory');
const NotFoundError = require('../../../domain/errors/NotFoundError');

const VALID = ['Pendiente', 'Impreso', 'Cancelado'];

async function changePersonStatus(id, nuevoEstado, { userId, ipAddress, userAgent } = {}) {
  if (!VALID.includes(nuevoEstado)) throw new Error(`Estado inválido: ${nuevoEstado}`);
  const person = await getPersonRepository().findById(id);
  if (!person) throw new NotFoundError('Persona', id);

  const updated = await getPersonRepository().changeStatus(id, nuevoEstado);

  await getHistoryRepository().record({
    personId: id, userId, accion: 'CHANGE_STATUS',
    estadoResultante: nuevoEstado, ipAddress, userAgent,
  });

  return updated;
}

module.exports = { changePersonStatus };
