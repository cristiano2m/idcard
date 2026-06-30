const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const config = require('../config/config');
const fs = require('fs');

if (!fs.existsSync(config.logDir)) fs.mkdirSync(config.logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

const logFmt = printf(({ level, message, timestamp, stack }) =>
  `${timestamp} [${level}]: ${stack || message}`
);

const logger = createLogger({
  level: config.logLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFmt),
  transports: [
    new transports.DailyRotateFile({
      dirname: config.logDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
    new transports.DailyRotateFile({
      dirname: config.logDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
    }),
  ],
});

if (config.env !== 'production') {
  logger.add(new transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFmt),
  }));
}

module.exports = logger;
