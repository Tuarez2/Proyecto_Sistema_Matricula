'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const urlConexion = process.env.MYSQL_URL || process.env.MYSQL_URI || process.env.DATABASE_URL;

const credencialesDesdeUrl = () => {
  const url = new URL(urlConexion);

  return {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306
  };
};

const credencialesDesdeVariables = () => ({
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT)
});

const baseConfig = {
  ...(urlConexion ? credencialesDesdeUrl() : credencialesDesdeVariables()),
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
