const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { stats } = require('../controllers/DashboardController');

/** @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Estadísticas del dashboard
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }]
 */
router.get('/stats', authenticate, stats);

module.exports = router;
