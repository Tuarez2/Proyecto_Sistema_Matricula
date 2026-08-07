import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearAsignaturaPrueba,
  crearCarreraPrueba,
  crearDocentePrueba,
  crearPeriodoPrueba,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('validaciones-academicas');
let tokenAdministrador;
let carrera;
let asignatura;
let docente;
let periodoBase;

const cuerpoPeriodoValido = ({ anio, numero, estado } = {}) => ({
  codigo: `PER_${numero}_${sufijo}`.slice(0, 20),
  nombre: `Periodo academico ${numero} ${sufijo}`,
  fecha_inicio: `${anio}-01-01`,
  fecha_fin: `${anio}-06-30`,
  fecha_inicio_matricula: `${anio}-01-01T00:00:00.000Z`,
  fecha_fin_matricula: `${anio}-01-31T23:59:59.000Z`,
  ...(estado ? { estado } : {})
});

const cuerpoCarreraValido = (numero) => ({
  codigo: `CAR_${numero}_${sufijo}`.slice(0, 20),
  nombre: `Carrera ${numero} ${sufijo}`,
  duracion_semestres: 8,
  facultad_id: carrera.facultad.id
});

const cuerpoAsignaturaValido = (numero) => ({
  codigo: `ASG_${numero}_${sufijo}`.slice(0, 20),
  nombre: `Asignatura ${numero} ${sufijo}`,
  creditos: 4,
  nivel_academico: 2
});

const cuerpoCursoValido = ({ paralelo = 'A', cupo_maximo = 30 } = {}) => ({
  periodo_id: periodoBase.id,
  asignatura_id: asignatura.id,
  docente_id: docente.id,
  paralelo,
  aula: 'Aula 100',
  horario: 'Lunes 08:00',
  cupo_maximo
});

const crearPeriodo = (cuerpo) =>
  request(app).post('/api/v1/periodos-academicos').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

const crearCarrera = (cuerpo) =>
  request(app).post('/api/v1/carreras').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

const crearAsignatura = (cuerpo) =>
  request(app).post('/api/v1/asignaturas').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

describe('Validaciones academicas y matriculas', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    const carreraCreada = await crearCarreraPrueba(sufijo);
    carrera = carreraCreada;
    asignatura = await crearAsignaturaPrueba(sufijo);
    docente = await crearDocentePrueba(sufijo);
    periodoBase = await crearPeriodoPrueba(sufijo);
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  describe('Periodos academicos', () => {
    it('crea un periodo valido', async () => {
      const respuesta = await crearPeriodo(cuerpoPeriodoValido({ anio: 2030, numero: 1 }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.success).toBe(true);
    });

    it('rechaza un codigo duplicado', async () => {
      const primer = await crearPeriodo(cuerpoPeriodoValido({ anio: 2031, numero: 2 }));
      await crearPeriodo(cuerpoPeriodoValido({ anio: 2032, numero: 3 }));

      const respuesta = await crearPeriodo({
        ...cuerpoPeriodoValido({ anio: 2033, numero: 4 }),
        codigo: primer.body.data.codigo
      });

      expect(primer.status).toBe(201);
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe('PERIODO_CODIGO_DUPLICATED');
    });

    it('rechaza fechas desordenadas', async () => {
      const respuesta = await crearPeriodo({
        ...cuerpoPeriodoValido({ anio: 2034, numero: 5 }),
        fecha_inicio: '2034-06-30',
        fecha_fin: '2034-01-01'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza ventana de matricula fuera del periodo', async () => {
      const respuesta = await crearPeriodo({
        ...cuerpoPeriodoValido({ anio: 2035, numero: 6 }),
        fecha_inicio_matricula: '2035-12-01T00:00:00.000Z'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza un periodo solapado con otro existente', async () => {
      const existente = await crearPeriodo(cuerpoPeriodoValido({ anio: 2036, numero: 7 }));
      const solapado = await crearPeriodo({
        ...cuerpoPeriodoValido({ anio: 2036, numero: 8 }),
        fecha_inicio: '2036-03-01',
        fecha_fin: '2036-09-30',
        fecha_inicio_matricula: '2036-03-01T00:00:00.000Z',
        fecha_fin_matricula: '2036-03-31T23:59:59.000Z'
      });

      expect(existente.status).toBe(201);
      expect(solapado.status).toBe(409);
      expect(solapado.body.code).toBe('PERIODO_FECHAS_SOLAPADAS');
    });

    it('rechaza codigo vacio y con caracteres especiales', async () => {
      const vacio = await crearPeriodo({ ...cuerpoPeriodoValido({ anio: 2037, numero: 9 }), codigo: '   ' });
      const especial = await crearPeriodo({ ...cuerpoPeriodoValido({ anio: 2038, numero: 10 }), codigo: 'PER#0038' });

      expect(vacio.status).toBe(400);
      expect(especial.status).toBe(400);
    });
  });

  describe('Carreras', () => {
    it('crea una carrera valida', async () => {
      const respuesta = await crearCarrera(cuerpoCarreraValido(1));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.success).toBe(true);
    });

    it('rechaza codigo duplicado', async () => {
      const primera = await crearCarrera(cuerpoCarreraValido(2));
      const respuesta = await crearCarrera({
        ...cuerpoCarreraValido(3),
        codigo: primera.body.data.codigo
      });

      expect(primera.status).toBe(201);
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe('CARRERA_CODIGO_DUPLICATED');
    });

    it('rechaza una facultad inexistente', async () => {
      const respuesta = await crearCarrera({ ...cuerpoCarreraValido(4), facultad_id: 99999999 });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('FACULTAD_NOT_FOUND');
    });

    it('rechaza duracion de semestres invalida', async () => {
      const cero = await crearCarrera({ ...cuerpoCarreraValido(5), duracion_semestres: 0 });
      const excesiva = await crearCarrera({ ...cuerpoCarreraValido(6), duracion_semestres: 13 });

      expect(cero.status).toBe(400);
      expect(excesiva.status).toBe(400);
    });

    it('rechaza nombre vacio y codigo con espacios', async () => {
      const nombreVacio = await crearCarrera({ ...cuerpoCarreraValido(7), nombre: '   ' });
      const codigoEspacios = await crearCarrera({ ...cuerpoCarreraValido(8), codigo: 'CAR 8' });

      expect(nombreVacio.status).toBe(400);
      expect(codigoEspacios.status).toBe(400);
    });
  });

  describe('Asignaturas', () => {
    it('crea una asignatura valida', async () => {
      const respuesta = await crearAsignatura(cuerpoAsignaturaValido(1));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.success).toBe(true);
    });

    it('rechaza codigo duplicado', async () => {
      const primera = await crearAsignatura(cuerpoAsignaturaValido(2));
      const respuesta = await crearAsignatura({
        ...cuerpoAsignaturaValido(3),
        codigo: primera.body.data.codigo
      });

      expect(primera.status).toBe(201);
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe('ASIGNATURA_CODIGO_DUPLICATED');
    });

    it('rechaza creditos fuera de rango', async () => {
      const cero = await crearAsignatura({ ...cuerpoAsignaturaValido(4), creditos: 0 });
      const excesivos = await crearAsignatura({ ...cuerpoAsignaturaValido(5), creditos: 13 });

      expect(cero.status).toBe(400);
      expect(excesivos.status).toBe(400);
    });

    it('rechaza nivel academico fuera de rango', async () => {
      const cero = await crearAsignatura({ ...cuerpoAsignaturaValido(6), nivel_academico: 0 });
      const excesivo = await crearAsignatura({ ...cuerpoAsignaturaValido(7), nivel_academico: 13 });

      expect(cero.status).toBe(400);
      expect(excesivo.status).toBe(400);
    });

    it('rechaza nombre vacio', async () => {
      const respuesta = await crearAsignatura({ ...cuerpoAsignaturaValido(8), nombre: '   ' });

      expect(respuesta.status).toBe(400);
    });
  });

  describe('Cursos', () => {
    it('rechaza cupo maximo fuera de rango y paralelo vacio', async () => {
      const cupo = await request(app)
        .post('/api/v1/cursos')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send(cuerpoCursoValido({ paralelo: 'X', cupo_maximo: 101 }));
      const paraleloVacio = await request(app)
        .post('/api/v1/cursos')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send(cuerpoCursoValido({ paralelo: '   ' }));

      expect(cupo.status).toBe(400);
      expect(paraleloVacio.status).toBe(400);
    });

    it('rechaza docente inexistente', async () => {
      const respuesta = await request(app)
        .post('/api/v1/cursos')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ ...cuerpoCursoValido({ paralelo: 'Y' }), docente_id: 99999999 });

      expect(respuesta.status).toBe(404);
    });
  });

  describe('Malla curricular', () => {
    it('rechaza una asignatura inexistente en la asignacion', async () => {
      const respuesta = await request(app)
        .post('/api/v1/carrera-asignaturas')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ carrera_id: carrera.carrera.id, asignatura_id: 99999999 });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe('ASIGNATURA_NOT_FOUND');
    });

    it('rechaza una carrera inexistente en la asignacion', async () => {
      const respuesta = await request(app)
        .post('/api/v1/carrera-asignaturas')
        .set('Authorization', `Bearer ${tokenAdministrador}`)
        .send({ carrera_id: 99999999, asignatura_id: asignatura.id });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe('CARRERA_NOT_FOUND');
    });
  });
});
