const swaggerJsdoc = require('swagger-jsdoc');
const config = require('../../infrastructure/config/config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'IDCard API', version: '1.0.0', description: 'Sistema de Registro de Credenciales PVC' },
    servers: [{ url: `http://localhost:${config.port}/api` }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: [
    `${__dirname}/../routes/*.js`,
  ],
};

module.exports = swaggerJsdoc(options);
