import jwt from 'jsonwebtoken';

import environment from '../config/environment.js';

const ALGORITMO_JWT = 'HS256';

const firmarToken = (datosToken, secreto, expiracion) => {
  const token = jwt.sign(datosToken, secreto, {
    algorithm: ALGORITMO_JWT,
    expiresIn: expiracion
  });

  return {
    token,
    expiresAt: obtenerFechaExpiracionToken(token)
  };
};

const verificarToken = (token, secreto) =>
  jwt.verify(token, secreto, {
    algorithms: [ALGORITMO_JWT]
  });

export const obtenerFechaExpiracionToken = (token) => {
  const tokenDecodificado = jwt.decode(token);

  if (!tokenDecodificado?.exp) {
    return null;
  }

  return new Date(tokenDecodificado.exp * 1000);
};

export const firmarTokenAcceso = (datosToken) =>
  firmarToken(datosToken, environment.jwt.accessSecret, environment.jwt.accessExpiresIn);

export const verificarTokenAcceso = (token) => verificarToken(token, environment.jwt.accessSecret);

export const firmarTokenRenovacion = (datosToken) =>
  firmarToken(datosToken, environment.jwt.refreshSecret, environment.jwt.refreshExpiresIn);

export const verificarTokenRenovacion = (token) => verificarToken(token, environment.jwt.refreshSecret);

export const configuracionJwtDisponible = () =>
  Boolean(
    environment.jwt.accessSecret &&
      environment.jwt.refreshSecret &&
      environment.jwt.accessSecret !== environment.jwt.refreshSecret
  );

export default {
  obtenerFechaExpiracionToken,
  configuracionJwtDisponible,
  firmarTokenAcceso,
  verificarTokenAcceso,
  firmarTokenRenovacion,
  verificarTokenRenovacion
};
