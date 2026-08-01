import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { Asignatura, Carrera } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearAsignaturaPrueba,
  crearCarreraPrueba,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('malla');
let tokenAdministrador;
let carrera;
let asignatura;
let carreraAlterna;
let asignaturaAlterna;
let idAsignacion;

describe('Malla curricular', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    ({ carrera } = await crearCarreraPrueba(sufijo));
    asignatura = await crearAsignaturaPrueba(sufijo);
    ({ carrera: carreraAlterna } = await crearCarreraPrueba(`${sufijo}.alt`));
    asignaturaAlterna = await crearAsignaturaPrueba(`${sufijo}.alt`);
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('crea asociación válida y rechaza duplicada', async () => {
    const creada = await request(app)
      .post('/api/v1/carrera-asignaturas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: carrera.id, asignatura_id: asignatura.id });
    const duplicada = await request(app)
      .post('/api/v1/carrera-asignaturas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: carrera.id, asignatura_id: asignatura.id });

    idAsignacion = creada.body.data.id;

    expect(creada.status).toBe(201);
    expect(duplicada.status).toBe(409);
  });

  it('rechaza carrera/asignatura inexistente o inactiva', async () => {
    const carreraInexistente = await request(app)
      .post('/api/v1/carrera-asignaturas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: 99999999, asignatura_id: asignatura.id });
    const asignaturaInexistente = await request(app)
      .post('/api/v1/carrera-asignaturas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: carrera.id, asignatura_id: 99999999 });
    const carreraInactiva = await Carrera.create({
      codigo: `CMI${Date.now()}`.slice(0, 20),
      nombre: `Carrera inactiva ${sufijo}`,
      duracion_semestres: 8,
      facultad_id: carrera.facultad_id,
      activo: false
    });
    const asignaturaInactiva = await Asignatura.create({
      codigo: `AMI${Date.now()}`.slice(0, 20),
      nombre: `Asignatura inactiva ${sufijo}`,
      creditos: 3,
      nivel_academico: 1,
      activo: false
    });
    const carreraInactivaRespuesta = await request(app)
      .post('/api/v1/carrera-asignaturas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: carreraInactiva.id, asignatura_id: asignatura.id });
    const asignaturaInactivaRespuesta = await request(app)
      .post('/api/v1/carrera-asignaturas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: carrera.id, asignatura_id: asignaturaInactiva.id });

    expect(carreraInexistente.status).toBe(404);
    expect(asignaturaInexistente.status).toBe(404);
    expect(carreraInactivaRespuesta.status).toBe(409);
    expect(asignaturaInactivaRespuesta.status).toBe(409);
  });

  it('consulta existente, inexistente y lista asignaturas por carrera', async () => {
    const existente = await request(app)
      .get(`/api/v1/carrera-asignaturas/${idAsignacion}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inexistente = await request(app).get('/api/v1/carrera-asignaturas/999999-999999').set('Authorization', `Bearer ${tokenAdministrador}`);
    const asignaturasCarrera = await request(app)
      .get(`/api/v1/carreras/${carrera.id}/asignaturas`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(404);
    expect(asignaturasCarrera.status).toBe(200);
  });

  it('actualiza y elimina relación sin borrar carrera ni asignatura', async () => {
    const actualizada = await request(app)
      .put(`/api/v1/carrera-asignaturas/${idAsignacion}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ carrera_id: carreraAlterna.id, asignatura_id: asignaturaAlterna.id });
    const idActualizado = actualizada.body.data.id;
    const eliminada = await request(app)
      .delete(`/api/v1/carrera-asignaturas/${idActualizado}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const carreraExiste = await Carrera.findByPk(carreraAlterna.id);
    const asignaturaExiste = await Asignatura.findByPk(asignaturaAlterna.id);

    expect(actualizada.status).toBe(200);
    expect(eliminada.status).toBe(200);
    expect(carreraExiste).toBeTruthy();
    expect(asignaturaExiste).toBeTruthy();
  });
});
