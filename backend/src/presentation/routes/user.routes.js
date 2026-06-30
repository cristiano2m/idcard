const router = require('express').Router();
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/UserController');

const adminOnly = [authenticate, authorize('Administrador')];

/** @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/', ...adminOnly, ctrl.list);

/** @swagger
 * /users:
 *   post:
 *     summary: Crear usuario
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 */
router.post('/', ...adminOnly,
  [
    body('username').trim().notEmpty(),
    body('password').isLength({ min: 8 }),
    body('fullName').trim().notEmpty(),
    body('role').isIn(['Administrador', 'Operador', 'Supervisor']),
  ],
  validate, ctrl.create
);

/** @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 */
router.put('/:id', ...adminOnly, validate, ctrl.update);

/** @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 */
router.delete('/:id', ...adminOnly, ctrl.remove);

module.exports = router;
