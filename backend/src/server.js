import app from './app.js';
import environment from './config/environment.js';
import { verificarConexionBaseDatos, sequelize } from './config/database.js';
import logger from './config/logger.js';
import './models/index.js';

let server;

const iniciarServidor = async () => {
  try {
    await verificarConexionBaseDatos();

    server = app.listen(environment.port, () => {
      logger.info(`Server listening on http://localhost:${environment.port}`);
    });
  } catch (error) {
    logger.error('Unable to start server.', error);
    process.exit(1);
  }
};

const cerrarServidor = async (signal) => {
  logger.info(`${signal} received. Closing server...`);

  if (server) {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    return;
  }

  await sequelize.close();
  process.exit(0);
};

process.on('SIGINT', () => cerrarServidor('SIGINT'));
process.on('SIGTERM', () => cerrarServidor('SIGTERM'));

iniciarServidor();
