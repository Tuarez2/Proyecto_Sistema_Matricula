import request from 'supertest';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  ESTADOS_MATRICULA_OCUPAN_CUPO,
  ROLE_CODES
} from '../../src/constants/domain.constants.js';
import { CarreraAsignatura, Curso, Matricula } from '../../src/models/index.js';
import { obtenerTokenAdministrador, obtenerTokenUsuarioComun, obtenerTokenUsuarioPrueba } from '../helpers/autenticacion.js';
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

beforeAll(async () => {
  tokenAdministrador = await obtenerTokenAdministrador();
  escenario = await crearEscenarioMatricula(sufijo, { cantidadEstudiantes: 8, cupo_maximo: 2 });
});

afterAll(async () => {
  await limpiarDatosPrueba(sufijo);
});

describe('Matrículas', () => {
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

  it('rechaza el envío de calificacion_final en la creación', async () => {
    const respuesta = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estudiante_id: escenario.estudiantes[1].id,
        curso_id: escenario.curso.id,
        calificacion_final: 10
      });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe('UNKNOWN_FIELDS');
  });
});

describe('Autorización y aislamiento de datos', () => {
  it('rechaza solicitudes sin token en todos los endpoints', async () => {
    const listado = await request(app).get('/api/v1/matriculas');
    const detalle = await request(app).get(`/api/v1/matriculas/${matriculaCreada.id}`);
    const creacion = await request(app).post('/api/v1/matriculas').send({ estudiante_id: 1, curso_id: 1 });
    const cambioEstado = await request(app)
      .patch(`/api/v1/matriculas/${matriculaCreada.id}/estado`)
      .send({ estado: ENROLLMENT_STATUS.CANCELLED });

    expect(listado.status).toBe(401);
    expect(detalle.status).toBe(401);
    expect(creacion.status).toBe(401);
    expect(cambioEstado.status).toBe(401);
  });

  it('rechaza al docente todas las operaciones de matrículas', async () => {
    const { token } = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.docente`,
      codigoRol: ROLE_CODES.TEACHER
    });
    const listado = await request(app).get('/api/v1/matriculas').set('Authorization', `Bearer ${token}`);
    const detalle = await request(app).get(`/api/v1/matriculas/${matriculaCreada.id}`).set('Authorization', `Bearer ${token}`);
    const creacion = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${token}`)
      .send({ estudiante_id: escenario.estudiantes[1].id, curso_id: escenario.curso.id });
    const cambioEstado = await request(app)
      .patch(`/api/v1/matriculas/${matriculaCreada.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: ENROLLMENT_STATUS.CANCELLED });

    expect(listado.status).toBe(403);
    expect(detalle.status).toBe(403);
    expect(creacion.status).toBe(403);
    expect(cambioEstado.status).toBe(403);
  });

  it('permite al gestor de matrículas operar y ver datos personales', async () => {
    const { token } = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.gestor`,
      codigoRol: ROLE_CODES.ENROLLMENT_MANAGER
    });
    const listado = await request(app).get('/api/v1/matriculas').set('Authorization', `Bearer ${token}`);
    const detalle = await request(app).get(`/api/v1/matriculas/${matriculaCreada.id}`).set('Authorization', `Bearer ${token}`);
    const conDatosPersonales = listado.body.data.find((registro) => registro.estudiante?.identificacion);

    expect(listado.status).toBe(200);
    expect(detalle.status).toBe(200);
    expect(conDatosPersonales?.estudiante?.identificacion).toBeTruthy();
    expect(conDatosPersonales?.estudiante?.correo).toBeTruthy();
  });

  it('permite al estudiante ver solo sus propias matrículas sin datos personales', async () => {
    const cursoPropio = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'S',
      aula: 'Aula estudiante',
      horario: 'Horario estudiante',
      cupo_maximo: 2,
      estado: COURSE_STATUS.OPEN
    });
    const matriculaPropia = await crearMatriculaDirecta(escenario.estudiantes[7].id, cursoPropio.id);
    const { token } = await obtenerTokenUsuarioPrueba({
      sufijo: `${sufijo}.estudiante`,
      estudiante_id: escenario.estudiantes[7].id
    });
    const listado = await request(app).get('/api/v1/matriculas').set('Authorization', `Bearer ${token}`);
    const detallePropia = await request(app)
      .get(`/api/v1/matriculas/${matriculaPropia.id}`)
      .set('Authorization', `Bearer ${token}`);
    const detalleAjena = await request(app).get(`/api/v1/matriculas/${matriculaCreada.id}`).set('Authorization', `Bearer ${token}`);
    const filtroAjeno = await request(app)
      .get(`/api/v1/matriculas?estudiante_id=${escenario.estudiantes[0].id}`)
      .set('Authorization', `Bearer ${token}`);
    const creacion = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${token}`)
      .send({ estudiante_id: escenario.estudiantes[7].id, curso_id: escenario.curso.id });
    const cambioEstado = await request(app)
      .patch(`/api/v1/matriculas/${matriculaPropia.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: ENROLLMENT_STATUS.CANCELLED });

    expect(listado.status).toBe(200);
    expect(listado.body.data).toHaveLength(1);
    expect(listado.body.data[0].id).toBe(matriculaPropia.id);
    expect(listado.body.data[0].estudiante_id).toBe(escenario.estudiantes[7].id);
    expect(listado.body.data[0].estudiante.identificacion).toBeUndefined();
    expect(listado.body.data[0].estudiante.correo).toBeUndefined();
    expect(listado.body.data[0].curso.docente.identificacion).toBeUndefined();
    expect(detallePropia.status).toBe(200);
    expect(detallePropia.body.data.estudiante.identificacion).toBeUndefined();
    expect(detalleAjena.status).toBe(404);
    expect(filtroAjeno.status).toBe(200);
    expect(filtroAjeno.body.data).toHaveLength(1);
    expect(filtroAjeno.body.data[0].id).toBe(matriculaPropia.id);
    expect(creacion.status).toBe(403);
    expect(cambioEstado.status).toBe(403);
  });

  it('rechaza al estudiante sin estudiante vinculado', async () => {
    const { token } = await obtenerTokenUsuarioComun(`${sufijo}.sinvinculo`);
    const listado = await request(app).get('/api/v1/matriculas').set('Authorization', `Bearer ${token}`);
    const detalle = await request(app).get(`/api/v1/matriculas/${matriculaCreada.id}`).set('Authorization', `Bearer ${token}`);

    expect(listado.status).toBe(403);
    expect(detalle.status).toBe(403);
  });
});

describe('Listado, filtros y paginación', () => {
  let cursoListado;
  let matriculasListado;

  beforeAll(async () => {
    cursoListado = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'L',
      aula: 'Aula listado',
      horario: 'Horario listado',
      cupo_maximo: 10,
      estado: COURSE_STATUS.OPEN
    });
    const fechas = [
      [escenario.estudiantes[1].id, new Date('2026-01-10T00:00:00.000Z')],
      [escenario.estudiantes[6].id, new Date('2026-01-10T00:00:00.000Z')],
      [escenario.estudiantes[2].id, new Date('2026-02-15T12:00:00.000Z')],
      [escenario.estudiantes[3].id, new Date('2026-03-01T00:00:00.000Z')],
      [escenario.estudiantes[4].id, new Date('2026-03-01T23:59:59.000Z')],
      [escenario.estudiantes[5].id, new Date('2026-04-20T08:30:00.000Z')]
    ];
    matriculasListado = await Promise.all(
      fechas.map(([estudianteId, fecha]) =>
        Matricula.create({ estudiante_id: estudianteId, curso_id: cursoListado.id, fecha_matricula: fecha })
      )
    );
  });

  const listado = (params, token = tokenAdministrador) =>
    request(app).get(`/api/v1/matriculas${params}`).set('Authorization', `Bearer ${token}`);

  it('devuelve la forma de respuesta esperada', async () => {
    const respuesta = await listado('');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      success: true,
      data: expect.any(Array),
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number)
    });
  });

  it('ordena por fecha_matricula descendente y luego id descendente', async () => {
    const respuesta = await listado(`?curso_id=${cursoListado.id}&limit=100`);
    const idsEsperados = [...matriculasListado].reverse().map((matricula) => matricula.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.map((registro) => registro.id)).toEqual(idsEsperados);
  });

  it('aplica paginación y totales correctos', async () => {
    const pagina1 = await listado(`?curso_id=${cursoListado.id}&page=1&limit=2`);
    const pagina3 = await listado(`?curso_id=${cursoListado.id}&page=3&limit=2`);
    const pagina4 = await listado(`?curso_id=${cursoListado.id}&page=4&limit=2`);

    expect(pagina1.status).toBe(200);
    expect(pagina1.body.data).toHaveLength(2);
    expect(pagina1.body.total).toBe(6);
    expect(pagina1.body.totalPages).toBe(3);
    expect(pagina3.status).toBe(200);
    expect(pagina3.body.data).toHaveLength(2);
    expect(pagina4.status).toBe(200);
    expect(pagina4.body.data).toHaveLength(0);
  });

  it('rechaza paginación inválida', async () => {
    const pageCero = await listado('?page=0');
    const limitCientoUno = await listado('?limit=101');
    const pageNegativa = await listado('?page=-1');
    const limitCero = await listado('?limit=0');
    const pageTexto = await listado('?page=abc');
    const limitDecimal = await listado('?limit=2.5');

    expect(pageCero.status).toBe(400);
    expect(limitCientoUno.status).toBe(400);
    expect(pageNegativa.status).toBe(400);
    expect(limitCero.status).toBe(400);
    expect(pageTexto.status).toBe(400);
    expect(limitDecimal.status).toBe(400);
  });

  it('rechaza parámetros desconocidos y fechas inválidas', async () => {
    const desconocido = await listado('?campo_inventado=1');
    const fechaFormato = await listado('?fecha_desde=2026/03/01');
    const fechaInvalida = await listado('?fecha_desde=2026-13-45');
    const rangoIncoherente = await listado('?fecha_desde=2026-05-01&fecha_hasta=2026-04-01');

    expect(desconocido.status).toBe(400);
    expect(fechaFormato.status).toBe(400);
    expect(fechaInvalida.status).toBe(400);
    expect(rangoIncoherente.status).toBe(400);
  });

  it('incluye los registros límite del día en el filtro de fecha', async () => {
    const respuesta = await listado(`?curso_id=${cursoListado.id}&fecha_desde=2026-03-01&fecha_hasta=2026-03-01`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toHaveLength(2);
    expect(respuesta.body.data.map((registro) => registro.estudiante_id).sort()).toEqual(
      [escenario.estudiantes[3].id, escenario.estudiantes[4].id].sort()
    );
  });

  it('filtra por rango de fechas', async () => {
    const respuesta = await listado(`?curso_id=${cursoListado.id}&fecha_desde=2026-02-01&fecha_hasta=2026-03-31`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toHaveLength(3);
  });

  it('filtra por estudiante, curso, periodo, asignatura y carrera', async () => {
    const porEstudiante = await listado(`?estudiante_id=${escenario.estudiantes[1].id}`);
    const porCurso = await listado(`?curso_id=${escenario.curso.id}`);
    const porPeriodo = await listado(`?periodo_id=${escenario.periodo.id}&curso_id=${cursoListado.id}`);
    const porAsignatura = await listado(`?asignatura_id=${escenario.asignatura.id}&curso_id=${cursoListado.id}`);
    const porCarrera = await listado(`?carrera_id=${escenario.carrera.id}&curso_id=${cursoListado.id}`);

    expect(porEstudiante.status).toBe(200);
    expect(porEstudiante.body.data.length).toBeGreaterThan(0);
    expect(porEstudiante.body.data.every((registro) => registro.estudiante_id === escenario.estudiantes[1].id)).toBe(true);
    expect(porEstudiante.body.data.some((registro) => registro.curso_id === cursoListado.id)).toBe(true);

    expect(porCurso.status).toBe(200);
    expect(porCurso.body.data).toHaveLength(1);
    expect(porCurso.body.data[0].id).toBe(matriculaCreada.id);

    expect(porPeriodo.status).toBe(200);
    expect(porPeriodo.body.data).toHaveLength(6);
    expect(porPeriodo.body.data.every((registro) => registro.curso.periodo_id === escenario.periodo.id)).toBe(true);

    expect(porAsignatura.status).toBe(200);
    expect(porAsignatura.body.data).toHaveLength(6);
    expect(porAsignatura.body.data.every((registro) => registro.curso.asignatura_id === escenario.asignatura.id)).toBe(true);

    expect(porCarrera.status).toBe(200);
    expect(porCarrera.body.data).toHaveLength(6);
    expect(porCarrera.body.data.every((registro) => registro.estudiante.carrera_id === escenario.carrera.id)).toBe(true);
  });

  it('filtra por estado', async () => {
    const retiradas = await listado(`?estado=${ENROLLMENT_STATUS.WITHDRAWN}`);
    const anuladas = await listado(`?estado=${ENROLLMENT_STATUS.CANCELLED}`);
    const inscritas = await listado(`?estado=${ENROLLMENT_STATUS.ENROLLED}&curso_id=${cursoListado.id}`);

    expect(retiradas.status).toBe(200);
    expect(retiradas.body.data.length).toBeGreaterThan(0);
    expect(retiradas.body.data.every((registro) => registro.estado === ENROLLMENT_STATUS.WITHDRAWN)).toBe(true);

    expect(anuladas.status).toBe(200);
    expect(anuladas.body.data.length).toBeGreaterThan(0);
    expect(anuladas.body.data.every((registro) => registro.estado === ENROLLMENT_STATUS.CANCELLED)).toBe(true);

    expect(inscritas.status).toBe(200);
    expect(inscritas.body.data.every((registro) => registro.estado === ENROLLMENT_STATUS.ENROLLED)).toBe(true);
  });
});

describe('Reinscripción tras retirada o anulación', () => {
  it('rechaza reinscribir al mismo estudiante tras retirarse', async () => {
    const curso = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'R1',
      aula: 'Aula reinscripcion retirada',
      horario: 'Horario reinscripcion retirada',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    const matricula = await crearMatriculaDirecta(escenario.estudiantes[2].id, curso.id);
    const retirada = await request(app)
      .patch(`/api/v1/matriculas/${matricula.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ENROLLMENT_STATUS.WITHDRAWN });
    const reinscripcion = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[2].id, curso_id: curso.id });

    expect(retirada.status).toBe(200);
    expect(reinscripcion.status).toBe(409);
  });

  it('rechaza reinscribir al mismo estudiante tras anular', async () => {
    const curso = await Curso.create({
      periodo_id: escenario.periodo.id,
      asignatura_id: escenario.asignatura.id,
      docente_id: escenario.docente.id,
      paralelo: 'R2',
      aula: 'Aula reinscripcion anulada',
      horario: 'Horario reinscripcion anulada',
      cupo_maximo: 1,
      estado: COURSE_STATUS.OPEN
    });
    const matricula = await crearMatriculaDirecta(escenario.estudiantes[5].id, curso.id);
    const anulada = await request(app)
      .patch(`/api/v1/matriculas/${matricula.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estado: ENROLLMENT_STATUS.CANCELLED });
    const reinscripcion = await request(app)
      .post('/api/v1/matriculas')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({ estudiante_id: escenario.estudiantes[5].id, curso_id: curso.id });

    expect(anulada.status).toBe(200);
    expect(reinscripcion.status).toBe(409);
  });
});
