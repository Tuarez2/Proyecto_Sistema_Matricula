import request from 'supertest';

import app from '../../src/app.js';
import { ROLE_CODES, USER_STATUS } from '../../src/constants/domain.constants.js';
import { Rol, Sesion, Usuario } from '../../src/models/index.js';
import { generarHashPassword } from '../../src/utils/password.js';

export const iniciarSesionAdministrador = () =>
  request(app).post('/api/v1/auth/login').send({
    correo: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD
  });

export const obtenerTokenAdministrador = async () => {
  const respuesta = await iniciarSesionAdministrador();
  return respuesta.body.data.tokens.accessToken;
};

export const crearUsuarioPrueba = async ({
  sufijo,
  codigoRol = ROLE_CODES.STUDENT,
  estado = USER_STATUS.ACTIVE,
  estudiante_id = null,
  docente_id = null
} = {}) => {
  const rol = await Rol.findOne({ where: { codigo: codigoRol } });
  const password = `Password-${sufijo}-123!`;
  const usuario = await Usuario.create({
    nombres: 'Usuario',
    apellidos: 'Prueba',
    correo: `usuario.${codigoRol.toLowerCase()}.${sufijo}@codex.test`,
    password_hash: await generarHashPassword(password),
    estado,
    rol_id: rol.id,
    debe_cambiar_password: false,
    estudiante_id,
    docente_id
  });

  return { usuario, password };
};

export const obtenerTokenUsuarioPrueba = async ({
  sufijo,
  codigoRol = ROLE_CODES.STUDENT,
  estudiante_id = null,
  docente_id = null
} = {}) => {
  const { usuario, password } = await crearUsuarioPrueba({ sufijo, codigoRol, estudiante_id, docente_id });
  const respuesta = await request(app).post('/api/v1/auth/login').send({
    correo: usuario.correo,
    password
  });

  return { token: respuesta.body.data.tokens.accessToken, usuario, password };
};

export const obtenerTokenUsuarioComun = async (sufijo) => {
  const { usuario, password } = await crearUsuarioPrueba({ sufijo, codigoRol: ROLE_CODES.STUDENT });
  const respuesta = await request(app).post('/api/v1/auth/login').send({
    correo: usuario.correo,
    password
  });

  return { token: respuesta.body.data.tokens.accessToken, usuario, password };
};

export const revocarSesionesUsuario = (usuarioId) => Sesion.update({ revocada_en: new Date() }, { where: { usuario_id: usuarioId } });
