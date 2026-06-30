const { createUser } = require('../../application/use-cases/user-admin/CreateUser');
const { listUsers } = require('../../application/use-cases/user-admin/ListUsers');
const { updateUser } = require('../../application/use-cases/user-admin/UpdateUser');
const { deleteUser } = require('../../application/use-cases/user-admin/DeleteUser');

async function create(req, res, next) {
  try { res.status(201).json({ user: await createUser(req.body) }); } catch (err) { next(err); }
}

async function list(req, res, next) {
  try { res.json({ users: await listUsers() }); } catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ user: await updateUser(+req.params.id, req.body) }); } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { await deleteUser(+req.params.id); res.json({ message: 'Usuario eliminado' }); } catch (err) { next(err); }
}

module.exports = { create, list, update, remove };
