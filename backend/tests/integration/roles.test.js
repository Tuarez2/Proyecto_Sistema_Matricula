import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { ROLE_CODES } from '../../src/constants/domain.constants.js';
import { obtenerTokenAdministrador, obtenerTokenUsuarioComun } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('roles');
const codigosRolesSembrados = Object.values(ROLE_CODES);

let tokenAdministrador;
let tokenUsuarioComun;

describe('Roles', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    const usuarioComun = await obtenerTokenUsuarioComun(sufijo);
    tokenUsuarioComun = usuarioComun.token;
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('rechaza consulta sin token y usuario sin rol administrativo', async () => {
    const sinToken = await request(app).get('/api/v1/roles');
    const sinPermiso = await request(app).get('/api/v1/roles').set('Authorization', `Bearer ${tokenUsuarioComun}`);

    expect(sinToken.status).toBe(401);
    expect(sinPermiso.status).toBe(403);
  });

  it('lista roles activos para administradores', async () => {
    const respuesta = await request(app).get('/api/v1/roles').set('Authorization', `Bearer ${tokenAdministrador}`);
    const roles = respuesta.body.data;
    const codigos = roles.map((rol) => rol.codigo);

    expect(respuesta.status).toBe(200);
    expect(roles).toBeInstanceOf(Array);
    expect(codigos).toContain(ROLE_CODES.ADMIN);
    codigosRolesSembrados.forEach((codigo) => {
      expect(codigos).toContain(codigo);
    });
  });

  it('devuelve únicamente campos seguros sin relaciones ni hashes', async () => {
    const respuesta = await request(app).get('/api/v1/roles').set('Authorization', `Bearer ${tokenAdministrador}`);
    const rol = respuesta.body.data.find((registro) => registro.codigo === ROLE_CODES.ADMIN);

    expect(Object.keys(rol).sort()).toEqual(['activo', 'codigo', 'descripcion', 'id', 'nombre']);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/usuarios|password_hash|refresh_token_hash|tokens|created_at|updated_at/i);
  });

  it('mantiene un orden estable por nombre', async () => {
    const respuesta = await request(app).get('/api/v1/roles').set('Authorization', `Bearer ${tokenAdministrador}`);
    const nombres = respuesta.body.data.map((rol) => rol.nombre);
    const nombresOrdenados = [...nombres].sort((a, b) => a.localeCompare(b));

    expect(respuesta.status).toBe(200);
    expect(nombres).toEqual(nombresOrdenados);
  });
});
