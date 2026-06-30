const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../docs/swagger');

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec));

module.exports = router;
