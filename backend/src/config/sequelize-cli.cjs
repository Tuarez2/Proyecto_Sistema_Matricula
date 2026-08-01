'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};

const obtenerBaseDatosPruebas = () => {
  const database = process.env.DB_NAME_TEST || process.env.DB_TEST_NAME || `${baseConfig.database}_test`;

  if (database === baseConfig.database) {
    throw new Error('Test database must be different from development database.');
  }

  if (!/test/i.test(database)) {
    throw new Error('Test database name must include "test".');
  }

  return database;
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    database: obtenerBaseDatosPruebas(),
    logging: false
  },
  production: {
    ...baseConfig,
    logging: false
  }
};
