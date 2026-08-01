import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { ROLE_CODES, USER_STATUS } from '../../src/constants/domain.constants.js';
import { Rol, Sesion, Usuario } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('usuarios');
let tokenAdministrador;
let rolEstudiante;
let usuarioCreado;

describe('Usuarios', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    rolEstudiante = await Rol.findOne({ where: { codigo: ROLE_CODES.STUDENT } });
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista usuarios como administrador sin campos sensibles', async () => {
    const respuesta = await request(app).get('/api/v1/usuarios').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toBeInstanceOf(Array);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/password_hash|refresh_token_hash/i);
  });

  it('crea usuario valido y rechaza correo duplicado', async () => {
    const cuerpo = {
      nombres: 'Usuario',
      apellidos: 'Integracion',
      correo: `usuario.creado.${sufijo}@codex.test`,
      password: 'UsuarioTest123!',
      rol_id: rolEstudiante.id,
      estado: USER_STATUS.ACTIVE
    };
    const creado = await request(app).post('/api/v1/usuarios').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);
    const duplicado = await request(app).post('/api/v1/usuarios').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

    usuarioCreado = creado.body.data;

    expect(creado.status).toBe(201);
    expect(duplicado.status).toBe(409);
    expect(JSON.stringify(creado.body)).not.toMatch(/password_hash|refresh_token_hash/i);
  });

  it('rechaza rol inexistente y datos invalidos', async () => {
    const rolInexistente = await request(app)
      .post('/api/v1/usuarios')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        nombres: 'Usuario',
        apellidos: 'Rol',
        correo: `usuario.rol.${sufijo}@codex.test`,
        password: 'UsuarioTest123!',
        rol_id: 99999999
      });
    const invalidos = await request(app).post('/api/v1/usuarios').set('Authorization', `Bearer ${tokenAdministrador}`).send({
      correo: 'correo-invalido',
      password: 'corta',
      rol_id: rolEstudiante.id
    });

    expect(rolInexistente.status).toBe(404);
    expect(invalidos.status).toBe(400);
  });

  it('consulta existente e inexistente', async () => {
    const existente = await request(app)
      .get(`/api/v1/usuarios/${usuarioCreado.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inexistente = await request(app).get('/api/v1/usuarios/99999999').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(404);
  });

  it('actualiza usuario y rechaza password_hash directo', async () => {
    const actualizado = await request(app)
      .put(`/api/v1/usuarios/${usuarioCreado.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ nombres: 'Usuario Editado' });
    const hashDirecto = await request(app)
      .put(`/api/v1/usuarios/${usuarioCreado.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ password_hash: 'hash-no-permitido' });

    expect(actualizado.status).toBe(200);
    expect(hashDirecto.status).toBe(400);
  });

  it('cambia contraseña y revoca sesiones previas', async () => {
    const loginAntes = await request(app).post('/api/v1/auth/login').send({
      correo: usuarioCreado.correo,
      password: 'UsuarioTest123!'
    });
    const tokenAnterior = loginAntes.body.data.tokens.accessToken;
    const cambio = await request(app)
      .patch(`/api/v1/usuarios/${usuarioCreado.id}/password`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ password: 'UsuarioNueva123!' });
    const meConTokenAnterior = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenAnterior}`);

    expect(loginAntes.status).toBe(200);
    expect(cambio.status).toBe(200);
    expect(meConTokenAnterior.status).toBe(401);
  });

  it('desactiva, impide login, reactiva y rechaza autodesactivacion admin', async () => {
    const desactivar = await request(app)
      .patch(`/api/v1/usuarios/${usuarioCreado.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: USER_STATUS.INACTIVE });
    const loginInactivo = await request(app).post('/api/v1/auth/login').send({
      correo: usuarioCreado.correo,
      password: 'UsuarioNueva123!'
    });
    const reactivar = await request(app)
      .patch(`/api/v1/usuarios/${usuarioCreado.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: USER_STATUS.ACTIVE });
    const admin = await Usuario.findOne({ where: { correo: process.env.INITIAL_ADMIN_EMAIL } });
    const autodesactivar = await request(app)
      .patch(`/api/v1/usuarios/${admin.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: USER_STATUS.INACTIVE });

    await Sesion.destroy({ where: { usuario_id: usuarioCreado.id } });

    expect(desactivar.status).toBe(200);
    expect(loginInactivo.status).toBe(401);
    expect(reactivar.status).toBe(200);
    expect(autodesactivar.status).toBe(409);
  });
});
