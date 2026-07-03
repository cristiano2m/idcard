const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/persons', require('./person.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/history', require('./history.routes'));
router.use('/users', require('./user.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/mdb', require('./mdb.routes'));
router.use('/mdb-updates', require('./mdb-updates.routes'));

module.exports = router;
