import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { ACADEMIC_STATUS } from '../../src/constants/domain.constants.js';
import { Estudiante } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { crearCarreraPrueba, generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('estudiantes');
const CANTIDAD_ESTUDIANTES = 13;
let tokenAdministrador;
let totalInicial;
let estudiantes;
let carreraA;
let carreraB;

const esActivo = (numero) => numero % 4 === 1;
const esSuspendido = (numero) => numero % 4 === 2;
const esInactivo = (numero) => numero % 4 === 3;
const esEgresado = (numero) => numero % 4 === 0;
const esNivelUno = (numero) => numero % 3 === 1;
const esCarreraA = (numero) => numero % 2 === 0;

const numeroMatricula = (numero) =>
  `MAT${String(numero).padStart(2, '0')}_${sufijo}`.slice(0, 30);
const identificacionEstudiante = (numero) =>
  `10${String(numero).padStart(7, '0')}`.slice(0, 20);
const nombreEstudiante = (numero) => `Estudiante ${numero}`;
const apellidoEstudiante = (numero) => `Prueba ${numero}`;
const correoEstudiante = (numero) =>
  `estudiante.${numero}.${sufijo}@codex.test`;
const estadoEstudiante = (numero) => {
  if (esActivo(numero)) {
    return ACADEMIC_STATUS.ACTIVE;
  }

  if (esSuspendido(numero)) {
    return ACADEMIC_STATUS.SUSPENDED;
  }

  if (esInactivo(numero)) {
    return ACADEMIC_STATUS.INACTIVE;
  }

  return ACADEMIC_STATUS.GRADUATED;
};

describe('Estudiantes', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    totalInicial = await Estudiante.count();

    const primeraCarrera = await crearCarreraPrueba(`${sufijo}.a`);
    const segundaCarrera = await crearCarreraPrueba(`${sufijo}.b`);
    carreraA = primeraCarrera.carrera;
    carreraB = segundaCarrera.carrera;

    estudiantes = await Estudiante.bulkCreate(
      Array.from({ length: CANTIDAD_ESTUDIANTES }, (_, indice) => {
        const numero = indice + 1;

        return {
          numero_matricula: numeroMatricula(numero),
          identificacion: identificacionEstudiante(numero),
          nombres: nombreEstudiante(numero),
          apellidos: apellidoEstudiante(numero),
          correo: correoEstudiante(numero),
          fecha_nacimiento: '2000-01-01',
          estado_academico: estadoEstudiante(numero),
          nivel_academico_actual: esNivelUno(numero) ? 1 : 2,
          carrera_id: esCarreraA(numero) ? carreraA.id : carreraB.id
        };
      })
    );
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista estudiantes con paginacion predeterminada', async () => {
    const respuesta = await request(app).get('/api/v1/estudiantes').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data).toBeInstanceOf(Array);
    expect(respuesta.body.data).toHaveLength(Math.min(10, respuesta.body.total));
    expect(respuesta.body.total).toBe(totalInicial + CANTIDAD_ESTUDIANTES);
  });

  it('responde con el formato paginado completo', async () => {
    const respuesta = await request(app).get('/api/v1/estudiantes').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.page).toBe(1);
    expect(respuesta.body.limit).toBe(10);
    expect(respuesta.body.total).toBeGreaterThanOrEqual(CANTIDAD_ESTUDIANTES);
    expect(respuesta.body.totalPages).toBe(Math.ceil(respuesta.body.total / 10));
    expect(respuesta.body.data[0]).toHaveProperty('id');
    expect(respuesta.body.data[0]).toHaveProperty('numero_matricula');
  });

  it('aplica page y limit devolviendo una segunda pagina sin solapamiento', async () => {
    const primeraPagina = await request(app)
      .get(`/api/v1/estudiantes?correo=${sufijo}&page=1&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const segundaPagina = await request(app)
      .get(`/api/v1/estudiantes?correo=${sufijo}&page=2&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(primeraPagina.body.page).toBe(1);
    expect(segundaPagina.body.page).toBe(2);
    expect(primeraPagina.body.total).toBe(CANTIDAD_ESTUDIANTES);
    expect(primeraPagina.body.totalPages).toBe(2);
    expect(primeraPagina.body.data).toHaveLength(10);
    expect(segundaPagina.body.data).toHaveLength(3);

    const idsPrimeraPagina = primeraPagina.body.data.map((estudiante) => estudiante.id);
    const idsSegundaPagina = segundaPagina.body.data.map((estudiante) => estudiante.id);
    const idsEsperados = estudiantes.map((estudiante) => estudiante.id).sort((a, b) => a - b);

    expect(idsPrimeraPagina.filter((id) => idsSegundaPagina.includes(id))).toEqual([]);
    expect([...idsPrimeraPagina, ...idsSegundaPagina].sort((a, b) => a - b)).toEqual(idsEsperados);
  });

  it('calcula total y totalPages con limite personalizado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?correo=${sufijo}&limit=5`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.limit).toBe(5);
    expect(respuesta.body.total).toBe(CANTIDAD_ESTUDIANTES);
    expect(respuesta.body.totalPages).toBe(3);
    expect(respuesta.body.data).toHaveLength(5);
  });

  it('filtra parcialmente por numero de matricula', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?numero_matricula=${numeroMatricula(2)}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].numero_matricula).toBe(numeroMatricula(2));
  });

  it('filtra parcialmente por identificacion', async () => {
    const respuesta = await request(app)
      .get('/api/v1/estudiantes?identificacion=100000003')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].identificacion).toBe('100000003');
  });

  it('filtra parcialmente por nombres', async () => {
    const respuesta = await request(app)
      .get('/api/v1/estudiantes?nombres=Estudiante%205')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].nombres).toBe('Estudiante 5');
  });

  it('filtra parcialmente por apellidos', async () => {
    const respuesta = await request(app)
      .get('/api/v1/estudiantes?apellidos=Prueba%206')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].apellidos).toBe('Prueba 6');
  });

  it('filtra parcialmente por correo', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?correo=estudiante.7.${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].correo).toBe(correoEstudiante(7));
  });

  it('filtra por carrera exacta', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?carrera_id=${carreraA.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadCarreraA = estudiantes.filter((estudiante) => estudiante.carrera_id === carreraA.id).length;

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(cantidadCarreraA);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((estudiante) => {
      expect(estudiante.carrera_id).toBe(carreraA.id);
    });
  });

  it('filtra por estado academico', async () => {
    const activos = await request(app)
      .get(`/api/v1/estudiantes?estado_academico=${ACADEMIC_STATUS.ACTIVE}&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const egresados = await request(app)
      .get(`/api/v1/estudiantes?estado_academico=${ACADEMIC_STATUS.GRADUATED}&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadActivos = estudiantes.filter(
      (estudiante) => estudiante.estado_academico === ACADEMIC_STATUS.ACTIVE,
    ).length;

    expect(activos.status).toBe(200);
    expect(egresados.status).toBe(200);
    expect(activos.body.total).toBe(cantidadActivos);
    expect(activos.body.total).toBeGreaterThan(0);
    expect(egresados.body.total).toBeGreaterThan(0);
    activos.body.data.forEach((estudiante) => {
      expect(estudiante.estado_academico).toBe(ACADEMIC_STATUS.ACTIVE);
    });
    egresados.body.data.forEach((estudiante) => {
      expect(estudiante.estado_academico).toBe(ACADEMIC_STATUS.GRADUATED);
    });
  });

  it('filtra por nivel academico actual', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?nivel_academico_actual=1&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadNivelUno = estudiantes.filter((estudiante) => estudiante.nivel_academico_actual === 1).length;

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(cantidadNivelUno);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((estudiante) => {
      expect(estudiante.nivel_academico_actual).toBe(1);
    });
  });

  it('combina filtros de estado, nivel, carrera y correo', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?estado_academico=${ACADEMIC_STATUS.ACTIVE}&nivel_academico_actual=1&carrera_id=${carreraB.id}&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(2);
    respuesta.body.data.forEach((estudiante) => {
      expect(estudiante.estado_academico).toBe(ACADEMIC_STATUS.ACTIVE);
      expect(estudiante.nivel_academico_actual).toBe(1);
      expect(estudiante.carrera_id).toBe(carreraB.id);
    });
  });

  it('devuelve una pagina vacia cuando no hay resultados', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?correo=${sufijo}&page=99`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual([]);
    expect(respuesta.body.total).toBe(CANTIDAD_ESTUDIANTES);
    expect(respuesta.body.totalPages).toBe(2);
  });

  it('conserva la relacion con la carrera en el listado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?numero_matricula=${numeroMatricula(2)}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const estudiante = respuesta.body.data[0];

    expect(respuesta.status).toBe(200);
    expect(estudiante.carrera).toBeTruthy();
    expect(estudiante.carrera.id).toBe(carreraA.id);
    expect(estudiante.carrera.codigo).toBeTruthy();
    expect(estudiante.carrera.nombre).toBeTruthy();
    expect(estudiante.carrera.activo).toBe(true);
  });

  it('no duplica estudiantes compartiendo carrera en el listado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/estudiantes?carrera_id=${carreraA.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadEsperada = estudiantes.filter((estudiante) => estudiante.carrera_id === carreraA.id).length;
    const ids = respuesta.body.data.map((estudiante) => estudiante.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(cantidadEsperada);
    expect(ids).toHaveLength(cantidadEsperada);
    expect(new Set(ids).size).toBe(cantidadEsperada);
  });

  it('rechaza page invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/estudiantes?page=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza limit invalido o superior al maximo', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/estudiantes?limit=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }

    const excedido = await request(app)
      .get('/api/v1/estudiantes?limit=101')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(excedido.status).toBe(400);
  });

  it('rechaza carrera_id invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/estudiantes?carrera_id=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza nivel_academico_actual invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/estudiantes?nivel_academico_actual=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza estado academico no permitido', async () => {
    const valoresInvalidos = ['ACTIVO', 'matriculado', 'retirado'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/estudiantes?estado_academico=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza parametros desconocidos en el listado', async () => {
    const respuesta = await request(app)
      .get('/api/v1/estudiantes?estado=activo')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(400);
  });

  it('rechaza el acceso sin autenticacion', async () => {
    const respuesta = await request(app).get('/api/v1/estudiantes');

    expect(respuesta.status).toBe(401);
  });
});
