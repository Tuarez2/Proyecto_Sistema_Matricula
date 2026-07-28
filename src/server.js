import app from './app.js';
import config from './config/env.js';
import { sequelize } from './models/index.js';

let server;

const bootstrap = async () => {
  try {
    await sequelize.authenticate();

    server = app.listen(config.port, () => {
      console.log(`Servidor escuchando en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('No fue posible iniciar el servidor:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} recibido. Cerrando servidor...`);

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

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap();
