import jwt from 'jsonwebtoken';

import environment from '../config/environment.js';

const JWT_ALGORITHM = 'HS256';

const signToken = (payload, secret, expiresIn) => {
  const token = jwt.sign(payload, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn
  });

  return {
    token,
    expiresAt: getTokenExpirationDate(token)
  };
};

const verifyToken = (token, secret) =>
  jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM]
  });

export const getTokenExpirationDate = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded?.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
};

export const signAccessToken = (payload) =>
  signToken(payload, environment.jwt.accessSecret, environment.jwt.accessExpiresIn);

export const verifyAccessToken = (token) => verifyToken(token, environment.jwt.accessSecret);

export const signRefreshToken = (payload) =>
  signToken(payload, environment.jwt.refreshSecret, environment.jwt.refreshExpiresIn);

export const verifyRefreshToken = (token) => verifyToken(token, environment.jwt.refreshSecret);

export const jwtConfigAvailable = () =>
  Boolean(
    environment.jwt.accessSecret &&
      environment.jwt.refreshSecret &&
      environment.jwt.accessSecret !== environment.jwt.refreshSecret
  );

export default {
  getTokenExpirationDate,
  jwtConfigAvailable,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken
};
