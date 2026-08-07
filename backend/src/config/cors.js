import environment from './environment.js';
import ApiError from '../utils/ApiError.js';

const metodosPermitidos = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const encabezadosPermitidos = ['Content-Type', 'Authorization'];

export const interpretarOrigenesPermitidos = (valor) => {
  const origenes = String(valor ?? '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  return [...new Set(origenes)];
};

const obtenerOrigenesConfigurados = () => {
  const origenes = interpretarOrigenesPermitidos(environment.cors.origins);

  if (environment.nodeEnv === 'production' && (origenes.length === 0 || origenes.includes('*'))) {
    throw new Error('CORS_ORIGINS must include explicit origins in production.');
  }

  if (environment.cors.credentials && origenes.includes('*')) {
    throw new Error('CORS_ORIGINS cannot include * when CORS_CREDENTIALS is true.');
  }

  return origenes.length > 0 ? origenes : ['http://localhost:3000', 'http://localhost:5173'];
};

export const construirConfiguracionCors = () => {
  const origenesPermitidos = obtenerOrigenesConfigurados();
  const permiteCualquierOrigen = origenesPermitidos.includes('*') && !environment.cors.credentials;

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (permiteCualquierOrigen || origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }

      return callback(new ApiError(403, 'Origen no permitido por CORS.', 'CORS_ORIGIN_NOT_ALLOWED'));
    },
    credentials: environment.cors.credentials,
    methods: metodosPermitidos,
    allowedHeaders: encabezadosPermitidos,
    optionsSuccessStatus: 204
  };
};

export default construirConfiguracionCors;
