const config = require('./src/infrastructure/config/config');
const logger = require('./src/infrastructure/logging/logger');

async function start() {
  const { runMigrations } = require('./src/infrastructure/database/sqlite/migrations/run-migrations');
  const { seedAdminUser } = require('./src/infrastructure/database/sqlite/seeds/seed-admin');

  await runMigrations();
  await seedAdminUser();

  const app = require('./src/presentation/app');
  const server = app.listen(config.port, () => {
    logger.info(`Servidor iniciado en puerto ${config.port} [${config.env}] driver=${config.dbDriver}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} recibido, cerrando servidor...`);
    server.close(() => {
      logger.info('Servidor cerrado.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
