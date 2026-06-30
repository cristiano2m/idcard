const { getPersonRepository } = require('../../infrastructure/database/RepositoryFactory');
const DuplicateError = require('../../domain/errors/DuplicateError');

async function checkDocumentoId(documentoId, excludeId = null) {
  const existing = await getPersonRepository().findByDocumentId(documentoId);
  if (existing && existing.id !== excludeId) throw new DuplicateError('documento_id', documentoId);
}

module.exports = { checkDocumentoId };
