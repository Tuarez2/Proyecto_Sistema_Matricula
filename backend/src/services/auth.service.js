import crypto from 'crypto';

import { ROLE_CODES, USER_STATUS } from '../constants/domain.constants.js';
import environment from '../config/environment.js';
import { Rol, Sesion, Usuario, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { compararPassword } from '../utils/password.js';
import { firmarTokenAcceso, firmarTokenRenovacion, verificarTokenRenovacion } from '../utils/jwt.js';

const MENSAJE_CREDENCIALES_INVALIDAS = 'Credenciales invalidas.';
const MENSAJE_TOKEN_INVALIDO = 'Token invalido o expirado.';

const inclusionesUsuario = [
  {
    model: Rol,
    as: 'rol',
    attributes: ['id', 'codigo', 'nombre', 'activo']
  }
];

export const sanitizarUsuario = (usuario) => {
  if (!usuario) return null;

  const usuarioPlano = typeof usuario.get === 'function' ? usuario.get({ plain: true }) : usuario;

  return {
    id: usuarioPlano.id,
    nombres: usuarioPlano.nombres,
    apellidos: usuarioPlano.apellidos,
    correo: usuarioPlano.correo,
    estado: usuarioPlano.estado,
    debe_cambiar_password: usuarioPlano.debe_cambiar_password,
    estudiante_id: usuarioPlano.estudiante_id ?? null,
    docente_id: usuarioPlano.docente_id ?? null,
    rol: usuarioPlano.rol
      ? {
          id: usuarioPlano.rol.id,
          codigo: usuarioPlano.rol.codigo,
          nombre: usuarioPlano.rol.nombre
        }
      : null
  };
};

const asegurarUsuarioActivo = (usuario) => {
  if (!usuario || usuario.estado !== USER_STATUS.ACTIVE || !usuario.rol?.activo) {
    throw new ApiError(401, MENSAJE_TOKEN_INVALIDO, 'INVALID_TOKEN');
  }
};

const construirDatosTokenAcceso = (usuario, sesionId) => ({
  sub: String(usuario.id),
  rol: usuario.rol.codigo,
  sessionId: String(sesionId)
});

const construirDatosTokenRenovacion = (usuario, sesionId) => ({
  sub: String(usuario.id),
  sessionId: String(sesionId),
  jti: crypto.randomUUID()
});

const emitirParTokens = (usuario, sesionId) => {
  const tokenAcceso = firmarTokenAcceso(construirDatosTokenAcceso(usuario, sesionId));
  const tokenRenovacion = firmarTokenRenovacion(construirDatosTokenRenovacion(usuario, sesionId));

  return {
    accessToken: tokenAcceso.token,
    refreshToken: tokenRenovacion.token,
    accessTokenExpiresAt: tokenAcceso.expiresAt,
    refreshTokenExpiresAt: tokenRenovacion.expiresAt
  };
};

const generarHashTokenRenovacion = (refreshToken) =>
  crypto.createHmac('sha256', environment.jwt.refreshSecret).update(refreshToken).digest('hex');

const compararTokenRenovacion = (refreshToken, hashTokenRenovacion) => {
  const hashActual = generarHashTokenRenovacion(refreshToken);
  const bufferActual = Buffer.from(hashActual, 'hex');
  const bufferAlmacenado = Buffer.from(hashTokenRenovacion, 'hex');

  return bufferActual.length === bufferAlmacenado.length && crypto.timingSafeEqual(bufferActual, bufferAlmacenado);
};

const obtenerIpCliente = (req) => req.ip || req.connection?.remoteAddress || null;

const obtenerUserAgent = (req) => {
  const userAgent = req.get('user-agent');
  return userAgent ? userAgent.slice(0, 255) : null;
};

export const login = async ({ correo, password, tipo }, req) => {
  const usuario = await Usuario.findOne({
    where: { correo },
    include: inclusionesUsuario
  });

  if (!usuario || usuario.estado !== USER_STATUS.ACTIVE || !usuario.rol?.activo) {
    throw new ApiError(401, MENSAJE_CREDENCIALES_INVALIDAS, 'INVALID_CREDENTIALS');
  }

  const passwordValido = await compararPassword(password, usuario.password_hash);

  if (!passwordValido) {
    throw new ApiError(401, MENSAJE_CREDENCIALES_INVALIDAS, 'INVALID_CREDENTIALS');
  }

  if (tipo === 'docente' && usuario.rol.codigo !== ROLE_CODES.TEACHER) {
    throw new ApiError(400, 'El correo no pertenece a un docente.', 'PROFILE_ROLE_MISMATCH');
  }

  if (tipo === 'estudiante' && usuario.rol.codigo !== ROLE_CODES.STUDENT) {
    throw new ApiError(400, 'El correo no pertenece a un estudiante.', 'PROFILE_ROLE_MISMATCH');
  }

  return sequelize.transaction(async (transaction) => {
    const hashRenovacionTemporal = generarHashTokenRenovacion(`${usuario.id}:${Date.now()}:${crypto.randomUUID()}`);
    const sesion = await Sesion.create(
      {
        usuario_id: usuario.id,
        refresh_token_hash: hashRenovacionTemporal,
        fecha_expiracion: new Date(Date.now() + 1000),
        direccion_ip: obtenerIpCliente(req),
        user_agent: obtenerUserAgent(req)
      },
      { transaction }
    );

    const tokens = emitirParTokens(usuario, sesion.id);
    const hashTokenRenovacion = generarHashTokenRenovacion(tokens.refreshToken);

    await sesion.update(
      {
        refresh_token_hash: hashTokenRenovacion,
        fecha_expiracion: tokens.refreshTokenExpiresAt
      },
      { transaction }
    );
    await usuario.update({ ultimo_acceso: new Date() }, { transaction });

    return {
      user: sanitizarUsuario(usuario),
      tokens
    };
  });
};

export const refresh = async (refreshToken) => {
  let datosToken;

  try {
    datosToken = verificarTokenRenovacion(refreshToken);
  } catch {
    throw new ApiError(401, MENSAJE_TOKEN_INVALIDO, 'INVALID_REFRESH_TOKEN');
  }

  const sesionId = Number(datosToken.sessionId);
  const usuarioId = Number(datosToken.sub);

  if (!Number.isInteger(sesionId) || !Number.isInteger(usuarioId)) {
    throw new ApiError(401, MENSAJE_TOKEN_INVALIDO, 'INVALID_REFRESH_TOKEN');
  }

  return sequelize.transaction(async (transaction) => {
    const sesion = await Sesion.findByPk(sesionId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: inclusionesUsuario
        }
      ]
    });

    if (
      !sesion ||
      sesion.usuario_id !== usuarioId ||
      sesion.revocada_en ||
      !sesion.fecha_expiracion ||
      sesion.fecha_expiracion <= new Date()
    ) {
      throw new ApiError(401, MENSAJE_TOKEN_INVALIDO, 'INVALID_REFRESH_TOKEN');
    }

    asegurarUsuarioActivo(sesion.usuario);

    const tokenValido = compararTokenRenovacion(refreshToken, sesion.refresh_token_hash);

    if (!tokenValido) {
      throw new ApiError(401, MENSAJE_TOKEN_INVALIDO, 'INVALID_REFRESH_TOKEN');
    }

    const tokens = emitirParTokens(sesion.usuario, sesion.id);
    const hashTokenRenovacion = generarHashTokenRenovacion(tokens.refreshToken);

    await sesion.update(
      {
        refresh_token_hash: hashTokenRenovacion,
        fecha_expiracion: tokens.refreshTokenExpiresAt
      },
      { transaction }
    );

    return {
      user: sanitizarUsuario(sesion.usuario),
      tokens
    };
  });
};

export const logout = async (sesionId) => {
  const sesion = await Sesion.findByPk(sesionId);

  if (sesion && !sesion.revocada_en) {
    await sesion.update({ revocada_en: new Date() });
  }

  return true;
};

export const obtenerUsuarioAutenticado = async (usuarioId) => {
  const usuario = await Usuario.findByPk(usuarioId, { include: inclusionesUsuario });
  asegurarUsuarioActivo(usuario);

  return sanitizarUsuario(usuario);
};

export const obtenerCodigoRolAdministrativo = () => ROLE_CODES.ADMIN;

export default {
  login,
  refresh,
  logout,
  obtenerUsuarioAutenticado,
  obtenerCodigoRolAdministrativo,
  sanitizarUsuario
};
