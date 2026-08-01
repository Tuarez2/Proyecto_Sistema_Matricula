import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { ACADEMIC_PERIOD_STATUS } from '../../src/constants/domain.constants.js';
import { Curso } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { crearCursoPrueba, crearPeriodoPrueba, generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('periodos');
let tokenAdministrador;
let periodoCreado;

describe('Periodos académicos', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista periodos', async () => {
    const respuesta = await request(app).get('/api/v1/periodos-academicos').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
  });

  it('crea periodo valido y rechaza codigo duplicado', async () => {
    const cuerpo = {
      codigo: `P${Date.now()}`.slice(0, 20),
      nombre: `Periodo API ${sufijo}`,
      fecha_inicio: '2027-01-01',
      fecha_fin: '2027-06-30',
      fecha_inicio_matricula: '2027-01-01T00:00:00.000Z',
      fecha_fin_matricula: '2027-01-31T23:59:59.000Z',
      estado: ACADEMIC_PERIOD_STATUS.PLANNED
    };
    const creado = await request(app).post('/api/v1/periodos-academicos').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);
    const duplicado = await request(app).post('/api/v1/periodos-academicos').set('Authorization', `Bearer ${tokenAdministrador}`).send({
      ...cuerpo,
      nombre: `Otro periodo ${sufijo}`
    });

    periodoCreado = creado.body.data;

    expect(creado.status).toBe(201);
    expect(duplicado.status).toBe(409);
  });

  it('rechaza fechas y ventana de matricula invalidas', async () => {
    const fechasInvalidas = await request(app)
      .post('/api/v1/periodos-academicos')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        codigo: `PI${Date.now()}`.slice(0, 20),
        nombre: `Periodo fechas ${sufijo}`,
        fecha_inicio: '2027-06-30',
        fecha_fin: '2027-01-01',
        fecha_inicio_matricula: '2027-01-01T00:00:00.000Z',
        fecha_fin_matricula: '2027-01-31T23:59:59.000Z'
      });
    const ventanaInvalida = await request(app)
      .post('/api/v1/periodos-academicos')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        codigo: `PV${Date.now()}`.slice(0, 20),
        nombre: `Periodo ventana ${sufijo}`,
        fecha_inicio: '2027-01-01',
        fecha_fin: '2027-06-30',
        fecha_inicio_matricula: '2026-12-01T00:00:00.000Z',
        fecha_fin_matricula: '2027-01-31T23:59:59.000Z'
      });

    expect(fechasInvalidas.status).toBe(400);
    expect(ventanaInvalida.status).toBe(400);
  });

  it('rechaza segundo periodo operativo', async () => {
    const operativo = await crearPeriodoPrueba(`${sufijo}.operativo`, { estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN });
    const segundo = await request(app)
      .post('/api/v1/periodos-academicos')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        codigo: `PO${Date.now()}`.slice(0, 20),
        nombre: `Periodo operativo duplicado ${sufijo}`,
        fecha_inicio: '2028-01-01',
        fecha_fin: '2028-06-30',
        fecha_inicio_matricula: '2028-01-01T00:00:00.000Z',
        fecha_fin_matricula: '2028-01-31T23:59:59.000Z',
        estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN
      });

    expect(operativo.estado).toBe(ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN);
    expect(segundo.status).toBe(409);
  });

  it('consulta inexistente, actualiza periodo y valida transiciones', async () => {
    const inexistente = await request(app).get('/api/v1/periodos-academicos/99999999').set('Authorization', `Bearer ${tokenAdministrador}`);
    const actualizacion = await request(app)
      .put(`/api/v1/periodos-academicos/${periodoCreado.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ nombre: `Periodo Editado ${sufijo}` });
    const cerrado = await crearPeriodoPrueba(`${sufijo}.cerrado`, { estado: ACADEMIC_PERIOD_STATUS.CLOSED });
    const invalida = await request(app)
      .patch(`/api/v1/periodos-academicos/${cerrado.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN });
    const planificado = await crearPeriodoPrueba(`${sufijo}.plan`, { estado: ACADEMIC_PERIOD_STATUS.PLANNED });
    const transicion = await request(app)
      .patch(`/api/v1/periodos-academicos/${planificado.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ACADEMIC_PERIOD_STATUS.CLOSED });
    const idempotente = await request(app)
      .patch(`/api/v1/periodos-academicos/${planificado.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ACADEMIC_PERIOD_STATUS.CLOSED });

    expect(inexistente.status).toBe(404);
    expect(actualizacion.status).toBe(200);
    expect(invalida.status).toBe(409);
    expect(transicion.status).toBe(200);
    expect(idempotente.status).toBe(200);
  });

  it('bloquea cambios de fechas cuando existen cursos', async () => {
    const { periodo, curso } = await crearCursoPrueba(`${sufijo}.curso`);
    const respuesta = await request(app)
      .put(`/api/v1/periodos-academicos/${periodo.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ fecha_inicio: '2026-01-02' });

    expect(curso).toBeTruthy();
    expect(respuesta.status).toBe(409);
    await Curso.destroy({ where: { id: curso.id } });
  });
});
