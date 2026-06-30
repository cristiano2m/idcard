const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/SettingsController');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, authorize('Administrador'), ctrl.set);

module.exports = router;
