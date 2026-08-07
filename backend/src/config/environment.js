import dotenv from 'dotenv';

dotenv.config();

const USA_URL_CONEXION = Boolean(process.env.MYSQL_URL || process.env.MYSQL_URI || process.env.DATABASE_URL);

const requiredVariables = [
  'NODE_ENV',
  'PORT',
  ...(USA_URL_CONEXION ? [] : ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']),
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD'
];

const missingVariables = requiredVariables.filter((name) => process.env[name] === undefined);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
}

if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT access and refresh secrets must be different.');
}

const obtenerNombreBaseDatos = () => {
  if (process.env.NODE_ENV !== 'test') {
    return process.env.DB_NAME;
  }

  const nombreBaseDatosPruebas = process.env.DB_NAME_TEST || process.env.DB_TEST_NAME || `${process.env.DB_NAME}_test`;

  if (nombreBaseDatosPruebas === process.env.DB_NAME) {
    throw new Error('Test database must be different from development database.');
  }

  if (!/test/i.test(nombreBaseDatosPruebas)) {
    throw new Error('Test database name must include "test".');
  }

  return nombreBaseDatosPruebas;
};

const toNumber = (name) => {
  const value = Number(process.env[name]);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return value;
};

const toOptionalNumber = (name, defaultValue) => {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return numberValue;
};

const toBoolean = (name, defaultValue = false) => {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) {
    return false;
  }

  throw new Error(`Environment variable ${name} must be a boolean value.`);
};

const interpretarTrustProxy = () => {
  const value = process.env.TRUST_PROXY;

  if (value === undefined || value === '' || ['false', '0', 'no', 'off'].includes(value.toLowerCase())) {
    return false;
  }

  if (value === '1') {
    return 1;
  }

  if (value === 'loopback') {
    return 'loopback';
  }

  throw new Error('TRUST_PROXY must be false, 1 or loopback.');
};

const parsearUrlBaseDeDatos = () => {
  const url = new URL(process.env.MYSQL_URL || process.env.MYSQL_URI || process.env.DATABASE_URL);

  if (url.protocol !== 'mysql:' && url.protocol !== 'mariadb:') {
    throw new Error('MYSQL_URL must use the mysql:// or mariadb:// protocol.');
  }

  const nombre = url.pathname.replace(/^\//, '');

  if (!nombre) {
    throw new Error('MYSQL_URL must include a database name.');
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    name: nombre,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password)
  };
};

const environment = Object.freeze({
  nodeEnv: process.env.NODE_ENV,
  port: toNumber('PORT'),
  cors: Object.freeze({
    origins: process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? '',
    credentials: toBoolean('CORS_CREDENTIALS', false)
  }),
  trustProxy: interpretarTrustProxy(),
  rateLimit: Object.freeze({
    generalWindowMs: toOptionalNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    generalMax: toOptionalNumber('RATE_LIMIT_MAX', 300),
    authWindowMs: toOptionalNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    authMax: toOptionalNumber('AUTH_RATE_LIMIT_MAX', 10)
  }),
  database: Object.freeze(
    USA_URL_CONEXION
      ? parsearUrlBaseDeDatos()
      : {
          host: process.env.DB_HOST,
          port: toNumber('DB_PORT'),
          name: obtenerNombreBaseDatos(),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD
        }
  ),
  initialAdmin: Object.freeze({
    firstName: process.env.INITIAL_ADMIN_FIRST_NAME || 'Administrador',
    lastName: process.env.INITIAL_ADMIN_LAST_NAME || 'Sistema',
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD
  }),
  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  })
});

export default environment;