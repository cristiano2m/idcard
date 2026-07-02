const cors = require('cors');
const config = require('../../infrastructure/config/config');

// Si corsOrigins contiene '*' o está vacío, refleja el origin del cliente
// (necesario para acceso por IP en red local). Para producción expuesta a
// internet, configurar CORS_ORIGINS en .env con dominios específicos.
const originOption =
  !config.corsOrigins.length || config.corsOrigins.includes('*')
    ? true
    : config.corsOrigins;

module.exports = cors({
  origin: originOption,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
