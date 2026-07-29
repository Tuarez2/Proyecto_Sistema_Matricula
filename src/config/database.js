import { Sequelize } from 'sequelize';

import environment from './environment.js';
import logger from './logger.js';

export const sequelize = new Sequelize(
  environment.database.name,
  environment.database.user,
  environment.database.password,
  {
    host: environment.database.host,
    port: environment.database.port,
    dialect: 'mysql',
    logging: environment.nodeEnv === 'production' ? false : (message) => logger.info(message),
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

export const checkDatabaseConnection = async () => {
  await sequelize.authenticate();
  logger.info('Database connection established.');
};

export default sequelize;
