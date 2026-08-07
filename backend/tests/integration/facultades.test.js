import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { Carrera } from '../../src/models/index.js';
import { obtenerTokenAdministrador, obtenerTokenUsuarioComun } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { crearFacultadPrueba, generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('facultades');
let tokenAdministrador;
let tokenComun;
let facultadCreada;

describe('Facultades', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    ({ token: tokenComun } = await obtenerTokenUsuarioComun(`${sufijo}.comun`));
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista facultades autenticado', async () => {
    const respuesta = await request(app).get('/api/v1/facultades').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
  });

  it('crea como administrador y rechaza usuario sin permisos', async () => {
    const cuerpo = { codigo: `F${Date.now()}`.slice(0, 20), nombre: `Facultad API ${sufijo}` };
    const sinPermiso = await request(app).post('/api/v1/facultades').set('Authorization', `Bearer ${tokenComun}`).send(cuerpo);
    const creada = await request(app).post('/api/v1/facultades').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

    facultadCreada = creada.body.data;

    expect(sinPermiso.status).toBe(403);
    expect(creada.status).toBe(201);
  });

  it('rechaza codigo duplicado, nombre duplicado y datos invalidos', async () => {
    const codigoDuplicado = await request(app)
      .post('/api/v1/facultades')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ codigo: facultadCreada.codigo, nombre: `Otra ${sufijo}` });
    const nombreDuplicado = await request(app)
      .post('/api/v1/facultades')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ codigo: `FX${Date.now()}`.slice(0, 20), nombre: facultadCreada.nombre });
    const invalidos = await request(app).post('/api/v1/facultades').set('Authorization', `Bearer ${tokenAdministrador}`).send({
      codigo: '',
      nombre: ''
    });

    expect(codigoDuplicado.status).toBe(409);
    expect(nombreDuplicado.status).toBe(409);
    expect(invalidos.status).toBe(400);
  });

  it('consulta existente e inexistente', async () => {
    const existente = await request(app)
      .get(`/api/v1/facultades/${facultadCreada.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inexistente = await request(app).get('/api/v1/facultades/99999999').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(404);
  });

  it('actualiza y rechaza campo desconocido', async () => {
    const actualizada = await request(app)
      .put(`/api/v1/facultades/${facultadCreada.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ nombre: `Facultad Editada ${sufijo}` });
    const desconocido = await request(app)
      .put(`/api/v1/facultades/${facultadCreada.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ nombre: `Facultad Editada ${sufijo}`, codigo_interno: 'x' });

    expect(actualizada.status).toBe(200);
    expect(desconocido.status).toBe(400);
  });

  it('desactiva sin carreras, reactiva y bloquea desactivacion con carreras activas', async () => {
    const facultadSinCarreras = await crearFacultadPrueba(`${sufijo}.sin`);
    const desactivar = await request(app)
      .patch(`/api/v1/facultades/${facultadSinCarreras.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ activo: false });
    const reactivar = await request(app)
      .patch(`/api/v1/facultades/${facultadSinCarreras.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ activo: true });

    await Carrera.create({
      codigo: `CF${Date.now()}`.slice(0, 20),
      nombre: `Carrera Facultad ${sufijo}`,
      duracion_semestres: 8,
      facultad_id: facultadCreada.id,
      activo: true
    });
    const conCarrera = await request(app)
      .patch(`/api/v1/facultades/${facultadCreada.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ activo: false });
    const sigueExistiendo = await request(app)
      .get(`/api/v1/facultades/${facultadCreada.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(desactivar.status).toBe(200);
    expect(reactivar.status).toBe(200);
    expect(conCarrera.status).toBe(409);
    expect(sigueExistiendo.status).toBe(200);
  });
});
