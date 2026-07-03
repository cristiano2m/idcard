const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/LicenseController');

router.get('/status', authenticate, ctrl.status);
router.post('/activate', authenticate, authorize('Administrador'), ctrl.activateLicense);

module.exports = router;
