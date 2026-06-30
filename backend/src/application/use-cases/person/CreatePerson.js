const { getPersonRepository, getHistoryRepository } = require('../../../infrastructure/database/RepositoryFactory');
const { checkDocumentoId } = require('../../services/DuplicateCheckService');
const { saveFromUploadedFile, saveFromBase64 } = require('../../services/PhotoService');
const { generate: generateQr } = require('../../services/QrCodeService');

async function createPerson(data, { uploadedFile, webcamBase64, userId, ipAddress, userAgent } = {}) {
  await checkDocumentoId(data.documentoId);

  let fotoPath = null;
  if (uploadedFile) {
    fotoPath = saveFromUploadedFile(uploadedFile);
  } else if (webcamBase64) {
    fotoPath = await saveFromBase64(webcamBase64);
  }

  const qrValue = data.documentoId;
  const qrPath = await generateQr(qrValue);

  const person = await getPersonRepository().create({
    ...data,
    fotoPath,
    qrPath,
    qrValue,
    barcodeValue: qrValue,
    createdByUserId: userId,
  });

  await getHistoryRepository().record({
    personId: person.id,
    userId,
    accion: 'CREATE_PERSON',
    estadoResultante: 'Pendiente',
    ipAddress,
    userAgent,
    detalle: { documentoId: data.documentoId, nombre: data.nombre, apellido: data.apellido },
  });

  return person;
}

module.exports = { createPerson };
