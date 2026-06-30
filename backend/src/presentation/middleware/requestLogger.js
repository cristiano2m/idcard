const morgan = require('morgan');
const logger = require('../../infrastructure/logging/logger');

const stream = { write: (msg) => logger.http(msg.trim()) };

module.exports = morgan('combined', { stream });
