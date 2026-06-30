const router = require('express').Router();
const { body, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { photoUpload } = require('../middleware/upload');
const ctrl = require('../controllers/PersonController');

const personBody = [
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
  body('apellido').trim().notEmpty().withMessage('Apellido es requerido'),
  body('equipo').trim().notEmpty().withMessage('Equipo es requerido'),
  body('documentoId').trim().notEmpty().withMessage('Documento ID es requerido'),
  body('numeroCamiseta').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Número de camiseta debe ser numérico'),
];

/**
 * @swagger
 * /persons:
 *   post:
 *     summary: Registrar nueva persona
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, equipo, documentoId]
 *             properties:
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               equipo: { type: string }
 *               documentoId: { type: string }
 *               fechaNacimiento: { type: string }
 *               numeroCamiseta: { type: integer }
 *               foto: { type: string, format: binary }
 *               webcamBase64: { type: string }
 *     responses:
 *       201:
 *         description: Persona registrada exitosamente
 */
router.post('/',
  authenticate,
  photoUpload.single('foto'),
  personBody,
  validate,
  ctrl.create
);

/**
 * @swagger
 * /persons:
 *   get:
 *     summary: Listar personas
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/', authenticate, ctrl.list);

/**
 * @swagger
 * /persons/search:
 *   get:
 *     summary: Buscar personas con filtros
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/search', authenticate, ctrl.search);

/**
 * @swagger
 * /persons/{id}:
 *   get:
 *     summary: Obtener persona por ID
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/:id', authenticate, ctrl.getById);

/**
 * @swagger
 * /persons/{id}:
 *   put:
 *     summary: Actualizar persona
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.put('/:id',
  authenticate,
  photoUpload.single('foto'),
  validate,
  ctrl.update
);

/**
 * @swagger
 * /persons/{id}/status:
 *   patch:
 *     summary: Cambiar estado de credencial
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.patch('/:id/status',
  authenticate,
  authorize('Administrador', 'Supervisor'),
  [body('estado').isIn(['Pendiente', 'Impreso', 'Cancelado'])],
  validate,
  ctrl.changeStatus
);

/**
 * @swagger
 * /persons/{id}/history:
 *   get:
 *     summary: Historial de cambios de una persona
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/:id/history', authenticate, ctrl.history);

/**
 * @swagger
 * /persons/{id}:
 *   delete:
 *     summary: Eliminar persona (soft delete)
 *     tags: [Persons]
 *     security: [{ cookieAuth: [] }]
 */
router.delete('/:id',
  authenticate,
  authorize('Administrador'),
  ctrl.remove
);

module.exports = router;
