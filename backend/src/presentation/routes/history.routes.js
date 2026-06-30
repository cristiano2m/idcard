const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { list } = require('../controllers/HistoryController');

/** @swagger
 * /history:
 *   get:
 *     summary: Listado de historial/auditoría
 *     tags: [History]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/', authenticate, list);

module.exports = router;
