import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { ACADEMIC_PERIOD_STATUS, COURSE_STATUS } from '../../src/constants/domain.constants.js';
import { Curso, Matricula } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearAsignaturaPrueba,
  crearDocentePrueba,
  crearEscenarioMatricula,
  crearMatriculaDirecta,
  crearPeriodoPrueba,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('cursos');
let tokenAdministrador;
let periodo;
let periodoCerrado;
let asignatura;
let asignaturaInactiva;
let asignaturaAlterna;
let docente;
let docenteInactivo;
let cursoCreado;

describe('Cursos', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    periodo = await crearPeriodoPrueba(sufijo, { estado: ACADEMIC_PERIOD_STATUS.PLANNED });
    periodoCerrado = await crearPeriodoPrueba(`${sufijo}.cerrado`, { estado: ACADEMIC_PERIOD_STATUS.CLOSED });
    asignatura = await crearAsignaturaPrueba(sufijo);
    asignaturaAlterna = await crearAsignaturaPrueba(`${sufijo}.alt`);
    asignaturaInactiva = await crearAsignaturaPrueba(`${sufijo}.inactiva`, { activo: false });
    docente = await crearDocentePrueba(sufijo);
    docenteInactivo = await crearDocentePrueba(`${sufijo}.inactivo`, { activo: false });
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('crea curso valido y rechaza combinación duplicada', async () => {
    const cuerpo = {
      periodo_id: periodo.id,
      asignatura_id: asignatura.id,
      docente_id: docente.id,
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00',
      cupo_maximo: 2,
      estado: COURSE_STATUS.OPEN
    };
    const creado = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);
    const duplicado = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

    cursoCreado = creado.body.data;

    expect(creado.status).toBe(201);
    expect(duplicado.status).toBe(409);
  });

  it('rechaza dependencias inexistentes o inactivas y cupo invalido', async () => {
    const base = {
      periodo_id: periodo.id,
      asignatura_id: asignatura.id,
      docente_id: docente.id,
      paralelo: 'B',
      aula: 'Aula 102',
      horario: 'Martes 08:00',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    };
    const periodoInexistente = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, periodo_id: 99999999 });
    const periodoNoHabilitado = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, periodo_id: periodoCerrado.id });
    const asignaturaInexistente = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, asignatura_id: 99999999 });
    const asignaturaNoActiva = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, asignatura_id: asignaturaInactiva.id });
    const docenteInexistente = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, docente_id: 99999999 });
    const docenteNoActivo = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, docente_id: docenteInactivo.id });
    const cupoInvalido = await request(app).post('/api/v1/cursos').set('Authorization', `Bearer ${tokenAdministrador}`).send({ ...base, cupo_maximo: 0 });

    expect(periodoInexistente.status).toBe(404);
    expect(periodoNoHabilitado.status).toBe(409);
    expect(asignaturaInexistente.status).toBe(404);
    expect(asignaturaNoActiva.status).toBe(409);
    expect(docenteInexistente.status).toBe(404);
    expect(docenteNoActivo.status).toBe(409);
    expect(cupoInvalido.status).toBe(400);
  });

  it('consulta existente y actualiza curso sin matriculas', async () => {
    const existente = await request(app).get(`/api/v1/cursos/${cursoCreado.id}`).set('Authorization', `Bearer ${tokenAdministrador}`);
    const actualizacion = await request(app)
      .put(`/api/v1/cursos/${cursoCreado.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ aula: 'Aula 201', horario: 'Viernes 10:00' });

    expect(existente.status).toBe(200);
    expect(actualizacion.status).toBe(200);
  });

  it('bloquea reducción de cupo y cambios críticos con matrículas', async () => {
    const escenario = await crearEscenarioMatricula(`${sufijo}.mat`, { cupo_maximo: 2 });
    await crearMatriculaDirecta(escenario.estudiantes[0].id, escenario.curso.id);
    await crearMatriculaDirecta(escenario.estudiantes[1].id, escenario.curso.id);

    const reducirCupo = await request(app)
      .put(`/api/v1/cursos/${escenario.curso.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ cupo_maximo: 1 });
    const nuevoPeriodo = await crearPeriodoPrueba(`${sufijo}.nuevo`, { estado: ACADEMIC_PERIOD_STATUS.PLANNED });
    const cambiarPeriodo = await request(app)
      .put(`/api/v1/cursos/${escenario.curso.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ periodo_id: nuevoPeriodo.id });
    const cambiarAsignatura = await request(app)
      .put(`/api/v1/cursos/${escenario.curso.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ asignatura_id: asignaturaAlterna.id });

    expect(reducirCupo.status).toBe(409);
    expect(cambiarPeriodo.status).toBe(409);
    expect(cambiarAsignatura.status).toBe(409);
  });

  it('aplica baja lógica y conserva matrículas', async () => {
    const escenario = await crearEscenarioMatricula(`${sufijo}.baja`, { cupo_maximo: 1 });
    const matricula = await crearMatriculaDirecta(escenario.estudiantes[0].id, escenario.curso.id);
    const baja = await request(app).delete(`/api/v1/cursos/${escenario.curso.id}`).set('Authorization', `Bearer ${tokenAdministrador}`);
    const matriculaExiste = await Matricula.findByPk(matricula.id);
    const curso = await Curso.findByPk(escenario.curso.id);

    expect(baja.status).toBe(200);
    expect(curso.estado).toBe(COURSE_STATUS.CANCELLED);
    expect(matriculaExiste).toBeTruthy();
  });
});
