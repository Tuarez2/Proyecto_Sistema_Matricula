import dotenv from 'dotenv';

dotenv.config();

const requiredVariables = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'INITIAL_ADMIN_FIRST_NAME',
  'INITIAL_ADMIN_LAST_NAME',
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

const toNumber = (name) => {
  const value = Number(process.env[name]);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return value;
};

const environment = Object.freeze({
  nodeEnv: process.env.NODE_ENV,
  port: toNumber('PORT'),
  cors: Object.freeze({
    origin: process.env.CORS_ORIGIN ?? '*'
  }),
  database: Object.freeze({
    host: process.env.DB_HOST,
    port: toNumber('DB_PORT'),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }),
  initialAdmin: Object.freeze({
    firstName: process.env.INITIAL_ADMIN_FIRST_NAME,
    lastName: process.env.INITIAL_ADMIN_LAST_NAME,
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD
  }),
  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  })
});

export default environment;
