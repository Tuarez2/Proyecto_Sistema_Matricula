import request from 'supertest';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  ROLE_CODES
} from '../../src/constants/domain.constants.js';
import { CarreraAsignatura, Curso, Matricula } from '../../src/models/index.js';
import { obtenerTokenAdministrador, obtenerTokenUsuarioPrueba } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearAsignaturaPrueba,
  crearCarreraPrueba,
  crearDocentePrueba,
  crearEstudiantePrueba,
  crearMatriculaDirecta,
  crearPeriodoPrueba,
  fechasFueraVentana,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('lote');
let tokenAdministrador;
let tokenGestor;
let escenario;

const crearEscenarioLote = async () => {
  const { carrera } = await crearCarreraPrueba(sufijo);
  const docente = await crearDocentePrueba(sufijo);
  const periodo = await crearPeriodoPrueba(sufijo);
  const asignaturas = [];
  const cursos = [];

  for (let indice = 1; indice <= 4; indice += 1) {
    const asignatura = await crearAsignaturaPrueba(`${sufijo}.asg${indice}`, {
      nivel_academico: 1
    });
    await CarreraAsignatura.create({ carrera_id: carrera.id, asignatura_id: asignatura.id });
    const curso = await Curso.create({
      periodo_id: periodo.id,
      asignatura_id: asignatura.id,
      docente_id: docente.id,
      paralelo: `A${indice}`,
      aula: `Aula lote ${indice}`,
      horario: `Horario lote ${indice}`,
      cupo_maximo: 3,
      estado: COURSE_STATUS.OPEN
    });
    asignaturas.push(asignatura);
    cursos.push(curso);
  }

  const estudiantes = [
    await crearEstudiantePrueba(sufijo, carrera.id, 1),
    await crearEstudiantePrueba(sufijo, carrera.id, 2),
    await crearEstudiantePrueba(sufijo, carrera.id, 3),
    await crearEstudiantePrueba(sufijo, carrera.id, 4)
  ];

  return { carrera, docente, periodo, asignaturas, cursos, estudiantes };
};

const crearCursoExtra = async (periodoId, asignaturaId, docenteId, paralelo, datos = {}) =>
  Curso.create({
    periodo_id: periodoId,
    asignatura_id: asignaturaId,
    docente_id: docenteId,
    paralelo,
    aula: `Aula ${paralelo}`,
    horario: `Horario ${paralelo}`,
    cupo_maximo: 1,
    estado: COURSE_STATUS.OPEN,
    ...datos
  });

const contarMatriculas = (cursoIds, estudianteIds) =>
  Matricula.count({
    where: {
      curso_id: { [Op.in]: cursoIds },
      estudiante_id: { [Op.in]: estudianteIds }
    }
  });

beforeAll(async () => {
  tokenAdministrador = await obtenerTokenAdministrador();
  const gestor = await obtenerTokenUsuarioPrueba({
    sufijo: `${sufijo}.gestor`,
    codigoRol: ROLE_CODES.ENROLLMENT_MANAGER
  });
  tokenGestor = gestor.token;
  escenario = await crearEscenarioLote();
});

afterAll(async () => {
  await limpiarDatosPrueba(sufijo);
});

describe('Matricula multiple en lote', () => {
  it('crea varios cursos, responde correctamente y agrupa por estudiante y periodo', async () => {
    const estudiante = escenario.estudiantes[0];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[0].id, escenario.cursos[1].id, escenario.cursos[2].id]
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      success: true,
      message: 'Matricula registrada correctamente',
      data: {
        estudiante: expect.any(Object),
        periodo: expect.any(Object),
        matriculas: expect.any(Array),
        total_cursos: 3
      }
    });
    expect(respuesta.body.data.estudiante.id).toBe(estudiante.id);
    expect(respuesta.body.data.periodo.id).toBe(escenario.periodo.id);
    expect(respuesta.body.data.matriculas).toHaveLength(3);
    respuesta.body.data.matriculas.forEach((matricula) => {
      expect(matricula.estudiante_id).toBe(estudiante.id);
      expect(matricula.curso.periodo_id).toBe(escenario.periodo.id);
      expect(matricula.estado).toBe(ENROLLMENT_STATUS.ENROLLED);
    });
  });

  it('permite operar al gestor de matriculas', async () => {
    const estudiante = escenario.estudiantes[1];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenGestor}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[0].id, escenario.cursos[1].id]
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.total_cursos).toBe(2);
  });

  it('hace rollback total cuando un curso esta lleno', async () => {
    const cursoLleno = await crearCursoExtra(
      escenario.periodo.id,
      escenario.asignaturas[0].id,
      escenario.docente.id,
      'LLENO'
    );
    await crearMatriculaDirecta(escenario.estudiantes[3].id, cursoLleno.id);

    const estudiante = escenario.estudiantes[2];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[3].id, cursoLleno.id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('CURSO_SIN_CUPOS');
    expect(await contarMatriculas([escenario.cursos[3].id, cursoLleno.id], [estudiante.id])).toBe(0);
  });

  it('hace rollback total cuando un curso ya fue matriculado', async () => {
    const estudiante = escenario.estudiantes[2];
    const cursoDuplicado = escenario.cursos[0];
    await crearMatriculaDirecta(estudiante.id, cursoDuplicado.id);

    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[2].id, cursoDuplicado.id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('MATRICULA_DUPLICADA');
    expect(await contarMatriculas([escenario.cursos[2].id], [estudiante.id])).toBe(0);
  });

  it('hace rollback total cuando el periodo esta cerrado', async () => {
    const periodoCerrado = await crearPeriodoPrueba(`${sufijo}.cerrado`, {
      estado: ACADEMIC_PERIOD_STATUS.CLOSED
    });
    const cursoCerrado = await crearCursoExtra(
      periodoCerrado.id,
      escenario.asignaturas[0].id,
      escenario.docente.id,
      'PC'
    );

    const estudiante = escenario.estudiantes[2];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [cursoCerrado.id, escenario.cursos[3].id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('PERIODO_NO_PERMITE_MATRICULA');
    expect(await contarMatriculas([cursoCerrado.id, escenario.cursos[3].id], [estudiante.id])).toBe(0);
  });

  it('hace rollback total cuando el periodo esta fuera de ventana', async () => {
    const periodoFueraVentana = await crearPeriodoPrueba(`${sufijo}.ventana`, {
      estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN,
      ...fechasFueraVentana()
    });
    const cursoVentana = await crearCursoExtra(
      periodoFueraVentana.id,
      escenario.asignaturas[0].id,
      escenario.docente.id,
      'PV'
    );

    const estudiante = escenario.estudiantes[1];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [cursoVentana.id, escenario.cursos[2].id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('PERIODO_FUERA_DE_VENTANA_MATRICULA');
    expect(await contarMatriculas([cursoVentana.id, escenario.cursos[2].id], [estudiante.id])).toBe(0);
  });

  it('hace rollback total cuando un curso esta inactivo', async () => {
    const cursoCancelado = await crearCursoExtra(
      escenario.periodo.id,
      escenario.asignaturas[0].id,
      escenario.docente.id,
      'CA',
      { estado: COURSE_STATUS.CANCELLED }
    );

    const estudiante = escenario.estudiantes[3];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [cursoCancelado.id, escenario.cursos[1].id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('CURSO_NO_DISPONIBLE');
    expect(await contarMatriculas([cursoCancelado.id, escenario.cursos[1].id], [estudiante.id])).toBe(0);
  });

  it('rechaza cursos de distintos periodos', async () => {
    const otroPeriodo = await crearPeriodoPrueba(`${sufijo}.otro`);
    const cursoOtroPeriodo = await crearCursoExtra(
      otroPeriodo.id,
      escenario.asignaturas[0].id,
      escenario.docente.id,
      'OP'
    );

    const estudiante = escenario.estudiantes[0];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[0].id, cursoOtroPeriodo.id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('CURSOS_DE_DISTINTOS_PERIODOS');
  });

  it('rechaza asignatura fuera de la malla del estudiante', async () => {
    const asignaturaFueraMalla = await crearAsignaturaPrueba(`${sufijo}.fuera`);
    const cursoFueraMalla = await crearCursoExtra(
      escenario.periodo.id,
      asignaturaFueraMalla.id,
      escenario.docente.id,
      'FM'
    );

    const estudiante = escenario.estudiantes[1];
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[3].id, cursoFueraMalla.id]
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('ASIGNATURA_FUERA_DE_MALLA');
    expect(await contarMatriculas([cursoFueraMalla.id, escenario.cursos[3].id], [estudiante.id])).toBe(0);
  });

  it('rechaza estudiante inexistente e inactivo', async () => {
    const inexistente = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: 99999999, curso_ids: [escenario.cursos[0].id] });
    const estudianteInactivo = await crearEstudiantePrueba(`${sufijo}.inactivo`, escenario.carrera.id, 9, {
      estado_academico: ACADEMIC_STATUS.INACTIVE
    });
    const inactivo = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: estudianteInactivo.id, curso_ids: [escenario.cursos[0].id] });

    expect(inexistente.status).toBe(404);
    expect(inactivo.status).toBe(409);
  });

  it('rechaza cuerpo vacio, array vacio, IDs repetidos e invalidos y campo desconocido', async () => {
    const estudiante = escenario.estudiantes[0];
    const sinCursos = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: estudiante.id });
    const arrayVacio = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: estudiante.id, curso_ids: [] });
    const repetidos = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[0].id, escenario.cursos[0].id]
      });
    const invalidos = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: 0, curso_ids: [0, 'x'] });
    const desconocido = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: estudiante.id,
        curso_ids: [escenario.cursos[0].id],
        estado: ENROLLMENT_STATUS.ENROLLED
      });
    const estudianteInvalido = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: 'a', curso_ids: [1] });

    expect(sinCursos.status).toBe(400);
    expect(arrayVacio.status).toBe(400);
    expect(repetidos.status).toBe(400);
    expect(invalidos.status).toBe(400);
    expect(desconocido.status).toBe(400);
    expect(estudianteInvalido.status).toBe(400);
  });

  it('protege los cupos ante dos solicitudes concurrentes', async () => {
    const curso = await crearCursoExtra(
      escenario.periodo.id,
      escenario.asignaturas[0].id,
      escenario.docente.id,
      'CONC',
      { cupo_maximo: 1 }
    );
    const estudianteA = escenario.estudiantes[2];
    const estudianteB = escenario.estudiantes[3];

    const respuestas = await Promise.allSettled([
      request(app)
        .post('/api/v1/matriculas/lote')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ estudiante_id: estudianteA.id, curso_ids: [curso.id] }),
      request(app)
        .post('/api/v1/matriculas/lote')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ estudiante_id: estudianteB.id, curso_ids: [curso.id] })
    ]);
    const estados = respuestas.map((resultado) => resultado.value.status).sort((a, b) => a - b);
    const cantidadOcupada = await Matricula.count({
      where: {
        curso_id: curso.id,
        estado: { [Op.in]: [ENROLLMENT_STATUS.ENROLLED] }
      }
    });

    expect(estados).toEqual([201, 409]);
    expect(cantidadOcupada).toBe(1);
  });
});

describe('Autorizacion de la matricula en lote', () => {
  it('rechaza solicitudes sin autenticacion', async () => {
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .send({ estudiante_id: 1, curso_ids: [1] });

    expect(respuesta.status).toBe(401);
  });

  it('rechaza al estudiante', async () => {
    const { token } = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.estudiante`,
      estudiante_id: escenario.estudiantes[0].id
    });
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${token}`)
      .send({ estudiante_id: escenario.estudiantes[0].id, curso_ids: [escenario.cursos[0].id] });

    expect(respuesta.status).toBe(403);
  });

  it('rechaza al docente', async () => {
    const { token } = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.docente`,
      codigoRol: ROLE_CODES.TEACHER
    });
    const respuesta = await request(app)
      .post('/api/v1/matriculas/lote')
      .set('Authorization', `Bearer ${token}`)
      .send({ estudiante_id: escenario.estudiantes[0].id, curso_ids: [escenario.cursos[0].id] });

    expect(respuesta.status).toBe(403);
  });
});
