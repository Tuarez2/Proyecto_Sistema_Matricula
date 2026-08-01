import crypto from 'crypto';

import { ROLE_CODES, USER_STATUS } from '../constants/domain.constants.js';
import environment from '../config/environment.js';
import { Rol, Sesion, Usuario, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales invalidas.';
const INVALID_TOKEN_MESSAGE = 'Token invalido o expirado.';

const userInclude = [
  {
    model: Rol,
    as: 'rol',
    attributes: ['id', 'codigo', 'nombre', 'activo']
  }
];

export const sanitizeUser = (user) => {
  if (!user) return null;

  const plainUser = typeof user.get === 'function' ? user.get({ plain: true }) : user;

  return {
    id: plainUser.id,
    nombres: plainUser.nombres,
    apellidos: plainUser.apellidos,
    correo: plainUser.correo,
    estado: plainUser.estado,
    debe_cambiar_password: plainUser.debe_cambiar_password,
    rol: plainUser.rol
      ? {
          id: plainUser.rol.id,
          codigo: plainUser.rol.codigo,
          nombre: plainUser.rol.nombre
        }
      : null
  };
};

const ensureActiveUser = (user) => {
  if (!user || user.estado !== USER_STATUS.ACTIVE || !user.rol?.activo) {
    throw new ApiError(401, INVALID_TOKEN_MESSAGE, 'INVALID_TOKEN');
  }
};

const buildAccessPayload = (user, sessionId) => ({
  sub: String(user.id),
  rol: user.rol.codigo,
  sessionId: String(sessionId)
});

const buildRefreshPayload = (user, sessionId) => ({
  sub: String(user.id),
  sessionId: String(sessionId),
  jti: crypto.randomUUID()
});

const issueTokenPair = (user, sessionId) => {
  const access = signAccessToken(buildAccessPayload(user, sessionId));
  const refresh = signRefreshToken(buildRefreshPayload(user, sessionId));

  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshTokenExpiresAt: refresh.expiresAt
  };
};

const hashRefreshToken = (refreshToken) =>
  crypto.createHmac('sha256', environment.jwt.refreshSecret).update(refreshToken).digest('hex');

const compareRefreshToken = (refreshToken, refreshTokenHash) => {
  const currentHash = hashRefreshToken(refreshToken);
  const currentBuffer = Buffer.from(currentHash, 'hex');
  const storedBuffer = Buffer.from(refreshTokenHash, 'hex');

  return currentBuffer.length === storedBuffer.length && crypto.timingSafeEqual(currentBuffer, storedBuffer);
};

const getClientIp = (req) => req.ip || req.connection?.remoteAddress || null;

const getUserAgent = (req) => {
  const userAgent = req.get('user-agent');
  return userAgent ? userAgent.slice(0, 255) : null;
};

export const login = async ({ correo, password }, req) => {
  const user = await Usuario.findOne({
    where: { correo },
    include: userInclude
  });

  if (!user || user.estado !== USER_STATUS.ACTIVE || !user.rol?.activo) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await comparePassword(password, user.password_hash);

  if (!passwordMatches) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  return sequelize.transaction(async (transaction) => {
    const temporaryRefreshHash = hashRefreshToken(`${user.id}:${Date.now()}:${crypto.randomUUID()}`);
    const session = await Sesion.create(
      {
        usuario_id: user.id,
        refresh_token_hash: temporaryRefreshHash,
        fecha_expiracion: new Date(Date.now() + 1000),
        direccion_ip: getClientIp(req),
        user_agent: getUserAgent(req)
      },
      { transaction }
    );

    const tokens = issueTokenPair(user, session.id);
    const refreshTokenHash = hashRefreshToken(tokens.refreshToken);

    await session.update(
      {
        refresh_token_hash: refreshTokenHash,
        fecha_expiracion: tokens.refreshTokenExpiresAt
      },
      { transaction }
    );
    await user.update({ ultimo_acceso: new Date() }, { transaction });

    return {
      user: sanitizeUser(user),
      tokens
    };
  });
};

export const refresh = async (refreshToken) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, INVALID_TOKEN_MESSAGE, 'INVALID_REFRESH_TOKEN');
  }

  const sessionId = Number(payload.sessionId);
  const userId = Number(payload.sub);

  if (!Number.isInteger(sessionId) || !Number.isInteger(userId)) {
    throw new ApiError(401, INVALID_TOKEN_MESSAGE, 'INVALID_REFRESH_TOKEN');
  }

  const session = await Sesion.findByPk(sessionId, {
    include: [
      {
        model: Usuario,
        as: 'usuario',
        include: userInclude
      }
    ]
  });

  if (
    !session ||
    session.usuario_id !== userId ||
    session.revocada_en ||
    !session.fecha_expiracion ||
    session.fecha_expiracion <= new Date()
  ) {
    throw new ApiError(401, INVALID_TOKEN_MESSAGE, 'INVALID_REFRESH_TOKEN');
  }

  ensureActiveUser(session.usuario);

  const tokenMatches = compareRefreshToken(refreshToken, session.refresh_token_hash);

  if (!tokenMatches) {
    throw new ApiError(401, INVALID_TOKEN_MESSAGE, 'INVALID_REFRESH_TOKEN');
  }

  const tokens = issueTokenPair(session.usuario, session.id);
  const refreshTokenHash = hashRefreshToken(tokens.refreshToken);

  await session.update({
    refresh_token_hash: refreshTokenHash,
    fecha_expiracion: tokens.refreshTokenExpiresAt
  });

  return {
    user: sanitizeUser(session.usuario),
    tokens
  };
};

export const logout = async (sessionId) => {
  const session = await Sesion.findByPk(sessionId);

  if (session && !session.revocada_en) {
    await session.update({ revocada_en: new Date() });
  }

  return true;
};

export const getAuthenticatedUser = async (userId) => {
  const user = await Usuario.findByPk(userId, { include: userInclude });
  ensureActiveUser(user);

  return sanitizeUser(user);
};

export const getAdministrativeRoleCode = () => ROLE_CODES.ADMIN;

export default {
  login,
  refresh,
  logout,
  getAuthenticatedUser,
  getAdministrativeRoleCode,
  sanitizeUser
};
