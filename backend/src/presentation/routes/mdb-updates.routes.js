const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const ctrl = require('../controllers/MdbUpdatesController');

router.get('/',        authenticate, ctrl.list);
router.post('/:id/impreso', authenticate, ctrl.markImpreso);

module.exports = router;
