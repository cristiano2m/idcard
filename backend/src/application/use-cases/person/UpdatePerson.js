const { getPersonRepository, getHistoryRepository } = require('../../../infrastructure/database/RepositoryFactory');
const { checkDocumentoId } = require('../../services/DuplicateCheckService');
const NotFoundError = require('../../../domain/errors/NotFoundError');
const { saveFromUploadedFile, saveFromBase64 } = require('../../services/PhotoService');

async function updatePerson(id, data, { uploadedFile, webcamBase64, userId, ipAddress, userAgent } = {}) {
  const existing = await getPersonRepository().findById(id);
  if (!existing) throw new NotFoundError('Persona', id);

  if (data.documentoId && data.documentoId !== existing.documentoId) {
    await checkDocumentoId(data.documentoId, id);
  }

  if (uploadedFile) data.fotoPath = saveFromUploadedFile(uploadedFile);
  else if (webcamBase64) data.fotoPath = await saveFromBase64(webcamBase64);

  const updated = await getPersonRepository().update(id, data);

  await getHistoryRepository().record({
    personId: id, userId, accion: 'UPDATE_PERSON', ipAddress, userAgent,
    detalle: { changes: Object.keys(data) },
  });

  return updated;
}

module.exports = { updatePerson };
