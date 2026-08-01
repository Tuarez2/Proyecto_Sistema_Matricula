import request from 'supertest';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  ESTADOS_MATRICULA_OCUPAN_CUPO
} from '../../src/constants/domain.constants.js';
import { CarreraAsignatura, Curso, Matricula } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearAsignaturaPrueba,
  crearEscenarioMatricula,
  crearEstudiantePrueba,
  crearMatriculaDirecta,
  crearPeriodoPrueba,
  fechasFueraVentana,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('matriculas');
let tokenAdministrador;
let escenario;
let matriculaCreada;

describe('Matrículas', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    escenario = await crearEscenarioMatricula(sufijo, { cantidadEstudiantes: 8, cupo_maximo: 2 });
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('crea matrícula válida y rechaza duplicada', async () => {
    const creada = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[0].id, curso_id: escenario.curso.id });
    const duplicada = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[0].id, curso_id: escenario.curso.id });

    matriculaCreada = creada.body.data;

    expect(creada.status).toBe(201);
    expect(duplicada.status).toBe(409);
  });

  it('rechaza estudiante inexistente, inhabilitado y curso inexistente', async () => {
    const estudianteInexistente = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: 99999999, curso_id: escenario.curso.id });
    const estudianteInhabilitado = await crearEstudiantePrueba(`${sufijo}.inhabilitado`, escenario.carrera.id, 20, {
      estado_academico: ACADEMIC_STATUS.SUSPENDED
    });
    const inhabilitado = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: estudianteInhabilitado.id, curso_id: escenario.curso.id });
    const cursoInexistente = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[1].id, curso_id: 99999999 });

    expect(estudianteInexistente.status).toBe(404);
    expect(inhabilitado.status).toBe(409);
    expect(cursoInexistente.status).toBe(404);
  });

  it('rechaza curso inactivo, periodo cerrado y fuera de ventana', async () => {
    const cursoCancelado = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'B',
      aula: 'Aula cancelada',
      horario: 'Horario cancelado',
      cupo_maximo: 1,
      estado: COURSE_STATUS.CANCELLED
    });
    const periodoCerrado = await crearPeriodoPrueba(`${sufijo}.cerrado`, { estado: ACADEMIC_PERIOD_STATUS.CLOSED });
    const cursoPeriodoCerrado = await Curso.create({
      periodo_id: periodoCerrado.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'C',
      aula: 'Aula cerrada',
      horario: 'Horario cerrado',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    const periodoFueraVentana = await crearPeriodoPrueba(`${sufijo}.ventana`, {
      estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN,
      ...fechasFueraVentana()
    });
    const cursoFueraVentana = await Curso.create({
      periodo_id: periodoFueraVentana.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'D',
      aula: 'Aula ventana',
      horario: 'Horario ventana',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });

    const cancelado = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[1].id, curso_id: cursoCancelado.id });
    const cerrado = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[1].id, curso_id: cursoPeriodoCerrado.id });
    const fueraVentana = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[1].id, curso_id: cursoFueraVentana.id });

    expect(cancelado.status).toBe(409);
    expect(cerrado.status).toBe(409);
    expect(fueraVentana.status).toBe(409);
  });

  it('rechaza asignatura fuera de malla, curso sin cupo, datos inválidos y campo desconocido', async () => {
    const asignaturaFueraMalla = await crearAsignaturaPrueba(`${sufijo}.fuera`);
    const cursoFueraMalla = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: asignaturaFueraMalla.id,
      docente_id: escenario.docente.id,
      paralelo: 'E',
      aula: 'Aula fuera',
      horario: 'Horario fuera',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    const cursoLleno = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'F',
      aula: 'Aula llena',
      horario: 'Horario llena',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    await crearMatriculaDirecta(escenario.estudiantes[1].id, cursoLleno.id);

    const fueraMalla = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[2].id, curso_id: cursoFueraMalla.id });
    const sinCupo = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[2].id, curso_id: cursoLleno.id });
    const invalidos = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: 0, curso_id: 'x' });
    const desconocido = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[2].id, curso_id: escenario.curso.id, estado: ENROLLMENT_STATUS.ENROLLED });

    expect(fueraMalla.status).toBe(409);
    expect(sinCupo.status).toBe(409);
    expect(invalidos.status).toBe(400);
    expect(desconocido.status).toBe(400);
  });

  it('consulta matrícula existente e inexistente', async () => {
    const existente = await request(app)
      .get(`/api/v1/matriculas/${matriculaCreada.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inexistente = await request(app).get('/api/v1/matriculas/99999999').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(404);
    expect(JSON.stringify(existente.body)).not.toMatch(/password_hash|refresh_token_hash|tokens/i);
  });

  it('cambia estado, responde idempotente, rechaza transición inválida y conserva registro', async () => {
    const retirada = await request(app)
      .patch(`/api/v1/matriculas/${matriculaCreada.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ENROLLMENT_STATUS.WITHDRAWN });
    const idempotente = await request(app)
      .patch(`/api/v1/matriculas/${matriculaCreada.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ENROLLMENT_STATUS.WITHDRAWN });
    const invalida = await request(app)
      .patch(`/api/v1/matriculas/${matriculaCreada.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ENROLLMENT_STATUS.ENROLLED });
    const sigueExistiendo = await Matricula.findByPk(matriculaCreada.id);

    expect(retirada.status).toBe(200);
    expect(idempotente.status).toBe(200);
    expect(invalida.status).toBe(409);
    expect(sigueExistiendo).toBeTruthy();
  });

  it('libera cupo lógico al anular', async () => {
    const curso = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'G',
      aula: 'Aula liberar',
      horario: 'Horario liberar',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    const matricula = await crearMatriculaDirecta(escenario.estudiantes[3].id, curso.id);
    const anulada = await request(app)
      .patch(`/api/v1/matriculas/${matricula.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ENROLLMENT_STATUS.CANCELLED });
    const nueva = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[4].id, curso_id: curso.id });

    expect(anulada.status).toBe(200);
    expect(nueva.status).toBe(201);
  });

  it('protege cupos ante concurrencia', async () => {
    const curso = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'H',
      aula: 'Aula concurrencia',
      horario: 'Horario concurrencia',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    const respuestas = await Promise.allSettled([
      request(app)
        .post('/api/v1/matriculas')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ estudiante_id: escenario.estudiantes[5].id, curso_id: curso.id }),
      request(app)
        .post('/api/v1/matriculas')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ estudiante_id: escenario.estudiantes[6].id, curso_id: curso.id })
    ]);
    const estados = respuestas.map((resultado) => resultado.value.status).sort((a, b) => a - b);
    const cantidadOcupada = await Matricula.count({
      where: {
        curso_id: curso.id,
        estado: { [Op.in]: ESTADOS_MATRICULA_OCUPAN_CUPO }
      }
    });

    expect(estados).toEqual([201, 409]);
    expect(cantidadOcupada).toBe(1);
  });

  it('no modifica estudiante, curso, periodo ni malla', async () => {
    const curso = await Curso.findByPk(escenario.curso.id);
    const asignacion = await CarreraAsignatura.findOne({
      where: { carrera_id: escenario.carrera.id, asignatura_id: escenario.asignatura.id }
    });

    expect(curso).toBeTruthy();
    expect(curso.periodo_id).toBe(escenario.periodo.id);
    expect(asignacion).toBeTruthy();
  });
});
