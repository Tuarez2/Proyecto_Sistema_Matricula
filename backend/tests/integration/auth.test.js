import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { USER_STATUS } from '../../src/constants/domain.constants.js';
import { Sesion } from '../../src/models/index.js';
import { crearUsuarioPrueba, obtenerTokenUsuarioComun } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('auth');

describe('Autenticación y autorización', () => {
  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('permite login valido sin exponer hashes', async () => {
    const respuesta = await request(app).post('/api/v1/auth/login').send({
      correo: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.tokens.accessToken).toBeTruthy();
    expect(JSON.stringify(respuesta.body)).not.toMatch(/password_hash|refresh_token_hash/i);
  });

  it('rechaza correo inexistente y contraseña incorrecta', async () => {
    const inexistente = await request(app).post('/api/v1/auth/login').send({
      correo: `inexistente.${sufijo}@codex.test`,
      password: 'Password123!'
    });
    const incorrecta = await request(app).post('/api/v1/auth/login').send({
      correo: process.env.INITIAL_ADMIN_EMAIL,
      password: 'PasswordIncorrecta123!'
    });

    expect(inexistente.status).toBe(401);
    expect(incorrecta.status).toBe(401);
  });

  it('rechaza usuario inactivo', async () => {
    const { usuario, password } = await crearUsuarioPrueba({ sufijo, estado: USER_STATUS.INACTIVE });
    const respuesta = await request(app).post('/api/v1/auth/login').send({
      correo: usuario.correo,
      password
    });

    expect(respuesta.status).toBe(401);
  });

  it('protege /auth/me sin token, token invalido y token de usuario inactivo', async () => {
    const { token, usuario } = await obtenerTokenUsuarioComun(`${sufijo}.me`);
    const sinToken = await request(app).get('/api/v1/auth/me');
    const invalido = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer token.invalido');

    await usuario.update({ estado: USER_STATUS.INACTIVE });
    const inactivo = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

    expect(sinToken.status).toBe(401);
    expect(invalido.status).toBe(401);
    expect(inactivo.status).toBe(401);
  });

  it('permite /auth/me con token valido', async () => {
    const { token } = await obtenerTokenUsuarioComun(`${sufijo}.valido`);
    const respuesta = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.user.correo).toContain(sufijo);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/password_hash|refresh_token_hash/i);
  });

  it('rota refresh token y revoca el token anterior de forma efectiva', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      correo: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD
    });
    const refreshTokenAnterior = login.body.data.tokens.refreshToken;
    const refresco = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: refreshTokenAnterior });
    const refreshTokenNuevo = refresco.body.data.tokens.refreshToken;
    const anteriorReutilizado = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: refreshTokenAnterior });

    expect(refresco.status).toBe(200);
    expect(refreshTokenNuevo).toBeTruthy();
    expect(anteriorReutilizado.status).toBe(401);
  });

  it('revoca refresh después de logout', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      correo: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD
    });
    const accessToken = login.body.data.tokens.accessToken;
    const refreshToken = login.body.data.tokens.refreshToken;
    const logout = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${accessToken}`);
    const refreshPosterior = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(logout.status).toBe(200);
    expect(refreshPosterior.status).toBe(401);
  });

  it('rechaza sesión revocada y rol no autorizado', async () => {
    const { token, usuario } = await obtenerTokenUsuarioComun(`${sufijo}.roles`);
    await Sesion.update({ revocada_en: new Date() }, { where: { usuario_id: usuario.id } });
    const sesionRevocada = await request(app).get('/api/v1/facultades').set('Authorization', `Bearer ${token}`);

    const { token: tokenComun } = await obtenerTokenUsuarioComun(`${sufijo}.forbidden`);
    const sinPermiso = await request(app)
      .post('/api/v1/facultades')
      .set('Authorization', `Bearer ${tokenComun}`)
      .send({ codigo: `FAUTH${Date.now()}`.slice(0, 20), nombre: `Facultad auth ${sufijo}` });

    expect(sesionRevocada.status).toBe(401);
    expect(sinPermiso.status).toBe(403);
  });
});
