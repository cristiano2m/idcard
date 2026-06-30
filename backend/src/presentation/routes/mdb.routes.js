const router = require('express').Router();
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/MdbController');

const adminOnly = [authenticate, authorize('Administrador')];

/** @swagger
 * /mdb/files:
 *   get:
 *     summary: Listar archivos .mdb disponibles en la carpeta base
 *     tags: [Mdb]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/files', ...adminOnly, ctrl.listFiles);

/** @swagger
 * /mdb/active:
 *   get:
 *     summary: Obtener la base .mdb activa actualmente
 *     tags: [Mdb]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/active', ...adminOnly, ctrl.getActive);

/** @swagger
 * /mdb/active:
 *   post:
 *     summary: Cambiar la base .mdb activa
 *     tags: [Mdb]
 *     security: [{ cookieAuth: [] }]
 */
router.post('/active', ...adminOnly,
  [body('mdbPath').trim().notEmpty()],
  validate,
  ctrl.setActive
);

/** @swagger
 * /mdb/import:
 *   post:
 *     summary: Importar todos los registros de la base .mdb activa hacia SQLite
 *     tags: [Mdb]
 *     security: [{ cookieAuth: [] }]
 */
router.post('/import', ...adminOnly, ctrl.importData);

/** @swagger
 * /mdb/records:
 *   get:
 *     summary: Ver registros en vivo de la base .mdb activa (solo lectura, no se importan)
 *     tags: [Mdb]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/records', ...adminOnly, ctrl.records);

module.exports = router;
