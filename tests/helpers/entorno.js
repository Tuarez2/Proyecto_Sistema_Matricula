import dotenv from 'dotenv';

dotenv.config();

const asegurarValor = (nombre, valor) => {
  if (process.env[nombre] === undefined || process.env[nombre] === '') {
    process.env[nombre] = valor;
  }
};

export const configurarEntornoPruebas = () => {
  asegurarValor('NODE_ENV', 'test');
  process.env.NODE_ENV = 'test';

  asegurarValor('PORT', '0');
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-character-value';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-character-value';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.INITIAL_ADMIN_FIRST_NAME = 'Admin';
  process.env.INITIAL_ADMIN_LAST_NAME = 'Pruebas';
  process.env.INITIAL_ADMIN_EMAIL = 'admin.codex.test@example.test';
  process.env.INITIAL_ADMIN_PASSWORD = 'AdminCodexTest123!';

  if (!process.env.DB_NAME_TEST && !process.env.DB_TEST_NAME) {
    process.env.DB_NAME_TEST = `${process.env.DB_NAME}_test`;
  }

  const nombreBaseDatosPruebas = obtenerNombreBaseDatosPruebas();

  if (nombreBaseDatosPruebas === process.env.DB_NAME) {
    throw new Error('La base de pruebas no puede coincidir con la base de desarrollo.');
  }

  if (!/test/i.test(nombreBaseDatosPruebas)) {
    throw new Error('El nombre de la base de pruebas debe contener "test".');
  }

  process.env.DB_NAME_TEST = nombreBaseDatosPruebas;
  process.env.DB_TEST_NAME = nombreBaseDatosPruebas;
};

export const obtenerNombreBaseDatosPruebas = () =>
  process.env.DB_NAME_TEST || process.env.DB_TEST_NAME || `${process.env.DB_NAME}_test`;

configurarEntornoPruebas();
