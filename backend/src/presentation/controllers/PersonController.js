const { createPerson } = require('../../application/use-cases/person/CreatePerson');
const { updatePerson } = require('../../application/use-cases/person/UpdatePerson');
const { getPersonById } = require('../../application/use-cases/person/GetPersonById');
const { listPersons } = require('../../application/use-cases/person/ListPersons');
const { searchPersons } = require('../../application/use-cases/person/SearchPersons');
const { changePersonStatus } = require('../../application/use-cases/person/ChangePersonStatus');
const { getPersonRepository, getHistoryRepository } = require('../../infrastructure/database/RepositoryFactory');

function getContext(req) {
  return { userId: req.user?.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

async function create(req, res, next) {
  try {
    const data = req.body;
    const { webcamBase64, ...rest } = data;
    const person = await createPerson(rest, {
      uploadedFile: req.file,
      webcamBase64: webcamBase64 || null,
      ...getContext(req),
    });
    res.status(201).json({ person });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await listPersons({ page: +page, pageSize: +pageSize });
    res.json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const person = await getPersonById(+req.params.id);
    res.json({ person });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = req.body;
    const { webcamBase64, ...rest } = data;
    const person = await updatePerson(+req.params.id, rest, {
      uploadedFile: req.file,
      webcamBase64: webcamBase64 || null,
      ...getContext(req),
    });
    res.json({ person });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ok = await getPersonRepository().softDelete(+req.params.id);
    if (!ok) { const NotFoundError = require('../../domain/errors/NotFoundError'); throw new NotFoundError('Persona', req.params.id); }
    await getHistoryRepository().record({ personId: +req.params.id, ...getContext(req), accion: 'DELETE_PERSON' });
    res.json({ message: 'Registro eliminado' });
  } catch (err) { next(err); }
}

async function search(req, res, next) {
  try {
    const { page = 1, pageSize = 20, nombre, equipo, documentoId, estado, fechaDesde, fechaHasta, sortBy, sortDir } = req.query;
    const result = await searchPersons(
      { nombre, equipo, documentoId, estado, fechaDesde, fechaHasta },
      { page: +page, pageSize: +pageSize, sortBy, sortDir }
    );
    res.json(result);
  } catch (err) { next(err); }
}

async function changeStatus(req, res, next) {
  try {
    const person = await changePersonStatus(+req.params.id, req.body.estado, getContext(req));
    res.json({ person });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const entries = await getHistoryRepository().listByPerson(+req.params.id);
    res.json({ entries });
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, update, remove, search, changeStatus, history };
