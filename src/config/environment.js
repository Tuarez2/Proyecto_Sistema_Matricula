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
  'INITIAL_ADMIN_FIRST_NAME',
  'INITIAL_ADMIN_LAST_NAME',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD'
];

const missingVariables = requiredVariables.filter((name) => process.env[name] === undefined);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
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
  })
});

export default environment;
