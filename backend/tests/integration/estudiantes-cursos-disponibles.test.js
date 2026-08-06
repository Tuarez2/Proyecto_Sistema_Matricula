import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ROLE_CODES
} from '../../src/constants/domain.constants.js';
import { CarreraAsignatura, Curso } from '../../src/models/index.js';
import { obtenerTokenAdministrador, obtenerTokenUsuarioPrueba } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearAsignaturaPrueba,
  crearCarreraPrueba,
  crearDocentePrueba,
  crearEstudiantePrueba,
  crearMatriculaDirecta,
  crearPeriodoPrueba,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('disp');
let tokenAdministrador;
let tokenGestor;
let escenario;

const crearEscenarioCursosDisponibles = async () => {
  const { carrera } = await crearCarreraPrueba(sufijo);
  const docente = await crearDocentePrueba(sufijo);
  const periodo = await crearPeriodoPrueba(sufijo);
  const asignatura = await crearAsignaturaPrueba(sufijo, { nivel_academico: 1 });
  await CarreraAsignatura.create({ carrera_id: carrera.id, asignatura_id: asignatura.id });

  const cursoDisponible = await Curso.create({
    periodo_id: periodo.id,
    asignatura_id: asignatura.id,
    docente_id: docente.id,
    paralelo: 'A',
    aula: 'Aula disponible',
    horario: 'Horario disponible',
    cupo_maximo: 5,
    estado: COURSE_STATUS.OPEN
  });

  const cursoCerrado = await Curso.create({
    periodo_id: periodo.id,
    asignatura_id: asignatura.id,
    docente_id: docente.id,
    paralelo: 'B',
    aula: 'Aula cerrada',
    horario: 'Horario cerrada',
    cupo_maximo: 5,
    estado: COURSE_STATUS.CLOSED
  });

  const cursoLleno = await Curso.create({
    periodo_id: periodo.id,
    asignatura_id: asignatura.id,
    docente_id: docente.id,
    paralelo: 'C',
    aula: 'Aula llena',
    horario: 'Horario llena',
    cupo_maximo: 1,
    estado: COURSE_STATUS.OPEN
  });

  const asignaturaFueraMalla = await crearAsignaturaPrueba(`${sufijo}.fuera`, { nivel_academico: 1 });
  const cursoFueraMalla = await Curso.create({
    periodo_id: periodo.id,
    asignatura_id: asignaturaFueraMalla.id,
    docente_id: docente.id,
    paralelo: 'D',
    aula: 'Aula fuera malla',
    horario: 'Horario fuera malla',
    cupo_maximo: 5,
    estado: COURSE_STATUS.OPEN
  });

  const estudiantes = [
    await crearEstudiantePrueba(sufijo, carrera.id, 1),
    await crearEstudiantePrueba(sufijo, carrera.id, 2)
  ];

  return {
    carrera,
    docente,
    periodo,
    asignatura,
    cursoDisponible,
    cursoCerrado,
    cursoLleno,
    cursoFueraMalla,
    estudiantes
  };
};

beforeAll(async () => {
  tokenAdministrador = await obtenerTokenAdministrador();
  const gestor = await obtenerTokenUsuarioPrueba({
    sufijo: `${sufijo}.gestor`,
    codigoRol: ROLE_CODES.ENROLLMENT_MANAGER
  });
  tokenGestor = gestor.token;
  escenario = await crearEscenarioCursosDisponibles();
});

afterAll(async () => {
  await limpiarDatosPrueba(sufijo);
});

const consultarCursosDisponibles = (estudianteId, periodoId, token = tokenAdministrador) =>
  request(app)
    .get(`/api/v1/estudiantes/${estudianteId}/cursos-disponibles?periodo_id=${periodoId}`)
    .set('Authorization', `Bearer ${token}`);

describe('Cursos disponibles para un estudiante', () => {
  it('devuelve solo cursos del periodo solicitado', async () => {
    const otroPeriodo = await crearPeriodoPrueba(`${sufijo}.otro`);
    const cursoOtroPeriodo = await Curso.create({
      periodo_id: otroPeriodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'E',
      aula: 'Aula otro periodo',
      horario: 'Horario otro periodo',
      cupo_maximo: 5,
      estado: COURSE_STATUS.OPEN
    });

    const respuesta = await consultarCursosDisponibles(escenario.estudiantes[0].id, escenario.periodo.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.cursos.some((curso) => curso.id === cursoOtroPeriodo.id)).toBe(false);
  });

  it('incluye solo cursos de la carrera del estudiante y excluye los demas casos', async () => {
    await crearMatriculaDirecta(escenario.estudiantes[0].id, escenario.cursoDisponible.id);
    await crearMatriculaDirecta(escenario.estudiantes[1].id, escenario.cursoLleno.id);

    const respuesta = await consultarCursosDisponibles(escenario.estudiantes[0].id, escenario.periodo.id);
    const ids = respuesta.body.data.cursos.map((curso) => curso.id);

    expect(respuesta.status).toBe(200);
    expect(ids).not.toContain(escenario.cursoFueraMalla.id);
    expect(ids).not.toContain(escenario.cursoCerrado.id);
    expect(ids).not.toContain(escenario.cursoLleno.id);
    expect(ids).not.toContain(escenario.cursoDisponible.id);
    expect(respuesta.body.data.estudiante_id).toBe(escenario.estudiantes[0].id);
    expect(respuesta.body.data.periodo.id).toBe(escenario.periodo.id);
  });

  it('incluye datos de asignatura, docente, periodo y cupos', async () => {
    const respuesta = await consultarCursosDisponibles(escenario.estudiantes[1].id, escenario.periodo.id);
    const curso = respuesta.body.data.cursos[0];

    expect(respuesta.status).toBe(200);
    expect(curso).toMatchObject({
      id: escenario.cursoDisponible.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'A',
      aula: 'Aula disponible',
      horario: 'Horario disponible',
      cupo_maximo: 5,
      cantidad_matriculados: 1,
      cupos_disponibles: 4,
      disponible: true
    });
    expect(curso.asignatura.nombre).toBeTruthy();
    expect(curso.docente.nombres).toBeTruthy();
    expect(curso.periodoAcademico.id).toBe(escenario.periodo.id);
  });

  it('rechaza estudiante inexistente e inactivo', async () => {
    const inexistente = await consultarCursosDisponibles(99999999, escenario.periodo.id);
    const estudianteInactivo = await crearEstudiantePrueba(`${sufijo}.inactivo`, escenario.carrera.id, 9, {
      estado_academico: ACADEMIC_STATUS.INACTIVE
    });
    const inactivo = await consultarCursosDisponibles(estudianteInactivo.id, escenario.periodo.id);

    expect(inexistente.status).toBe(404);
    expect(inactivo.status).toBe(409);
  });

  it('rechaza periodo cerrado, periodo inexistente y consulta sin periodo', async () => {
    const periodoCerrado = await crearPeriodoPrueba(`${sufijo}.cerrado`, {
      estado: ACADEMIC_PERIOD_STATUS.CLOSED
    });
    const cerrado = await consultarCursosDisponibles(escenario.estudiantes[1].id, periodoCerrado.id);
    const inexistente = await consultarCursosDisponibles(escenario.estudiantes[1].id, 99999999);
    const sinPeriodo = await request(app)
      .get(`/api/v1/estudiantes/${escenario.estudiantes[1].id}/cursos-disponibles`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(cerrado.status).toBe(409);
    expect(inexistente.status).toBe(404);
    expect(sinPeriodo.status).toBe(400);
  });

  it('protege el endpoint por rol', async () => {
    const sinToken = await request(app).get(
      `/api/v1/estudiantes/${escenario.estudiantes[0].id}/cursos-disponibles?periodo_id=${escenario.periodo.id}`
    );
    const docente = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.docente`,
      codigoRol: ROLE_CODES.TEACHER
    });
    const estudiante = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.estudiante`,
      estudiante_id: escenario.estudiantes[0].id
    });
    const conDocente = await request(app)
      .get(`/api/v1/estudiantes/${escenario.estudiantes[0].id}/cursos-disponibles?periodo_id=${escenario.periodo.id}`)
      .set('Authorization', `Bearer ${docente.token}`);
    const conEstudiante = await request(app)
      .get(`/api/v1/estudiantes/${escenario.estudiantes[0].id}/cursos-disponibles?periodo_id=${escenario.periodo.id}`)
      .set('Authorization', `Bearer ${estudiante.token}`);
    const conGestor = await consultarCursosDisponibles(
      escenario.estudiantes[0].id,
      escenario.periodo.id,
      tokenGestor
    );

    expect(sinToken.status).toBe(401);
    expect(conDocente.status).toBe(403);
    expect(conEstudiante.status).toBe(403);
    expect(conGestor.status).toBe(200);
  });
});

describe('Historial de matriculas del estudiante', () => {
  it('agrupa las matriculas por periodo con datos de cursos', async () => {
    const periodoAnterior = await crearPeriodoPrueba(`${sufijo}.anterior`, {
      estado: ACADEMIC_PERIOD_STATUS.IN_PROGRESS
    });
    const cursoAnterior = await Curso.create({
      periodo_id: periodoAnterior.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'H1',
      aula: 'Aula historial',
      horario: 'Horario historial',
      cupo_maximo: 5,
      estado: COURSE_STATUS.OPEN
    });
    await crearMatriculaDirecta(escenario.estudiantes[0].id, cursoAnterior.id);

    const respuesta = await request(app)
      .get(`/api/v1/matriculas?estudiante_id=${escenario.estudiantes[0].id}&limit=100`)
      .set('Authorization', `Bearer ${tokenGestor}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThanOrEqual(2);

    const periodos = [...new Set(respuesta.body.data.map((matricula) => matricula.curso.periodoAcademico.id))];
    expect(periodos).toContain(escenario.periodo.id);
    expect(periodos).toContain(periodoAnterior.id);

    respuesta.body.data.forEach((matricula) => {
      expect(matricula.estudiante_id).toBe(escenario.estudiantes[0].id);
      expect(matricula.curso.periodoAcademico).toBeTruthy();
    });
  });

  it('aisla el historial y protege los datos personales del estudiante', async () => {
    const { token } = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.historial`,
      estudiante_id: escenario.estudiantes[1].id
    });

    const listado = await request(app)
      .get(`/api/v1/matriculas?estudiante_id=${escenario.estudiantes[0].id}&limit=100`)
      .set('Authorization', `Bearer ${token}`);

    expect(listado.status).toBe(200);
    expect(listado.body.data.every((matricula) => matricula.estudiante_id === escenario.estudiantes[1].id)).toBe(true);
    expect(listado.body.data.every((matricula) => matricula.estudiante?.identificacion === undefined)).toBe(true);
    expect(listado.body.data.every((matricula) => matricula.estudiante?.correo === undefined)).toBe(true);
  });

  it('permite al gestor ver datos personales del estudiante en el historial', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/matriculas?estudiante_id=${escenario.estudiantes[0].id}&limit=100`)
      .set('Authorization', `Bearer ${tokenGestor}`);

    expect(respuesta.status).toBe(200);
    const conDatosPersonales = respuesta.body.data.some(
      (matricula) => matricula.estudiante?.identificacion && matricula.estudiante?.correo
    );
    expect(conDatosPersonales).toBe(true);
  });
});
