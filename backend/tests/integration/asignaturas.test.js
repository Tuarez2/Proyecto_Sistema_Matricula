import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { Asignatura, CarreraAsignatura } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import {
  crearCarreraPrueba,
  crearCursoPrueba,
  crearDocentePrueba,
  crearPeriodoPrueba,
  generarSufijoPrueba
} from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('asignaturas');
const CANTIDAD_ASIGNATURAS = 13;
let tokenAdministrador;
let totalInicial;
let asignaturas;
let carreraA;
let carreraB;

const esActiva = (numero) => numero % 3 !== 0;
const esProgramacion = (numero) => numero % 3 === 1;
const esNivelUno = (numero) => numero % 4 === 1;
const tieneCuatroCreditos = (numero) => numero <= 5;

const codigoAsignatura = (numero) =>
  `ASG${String(numero).padStart(2, '0')}_${sufijo}`.slice(0, 20);

describe('Asignaturas', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    totalInicial = await Asignatura.count();

    asignaturas = await Asignatura.bulkCreate(
      Array.from({ length: CANTIDAD_ASIGNATURAS }, (_, indice) => {
        const numero = indice + 1;

        return {
          codigo: codigoAsignatura(numero),
          nombre: `${esProgramacion(numero) ? 'Programacion' : 'Matematicas'} ${numero} ${sufijo}`,
          creditos: tieneCuatroCreditos(numero) ? 4 : 3,
          nivel_academico: esNivelUno(numero) ? 1 : 2,
          activo: esActiva(numero)
        };
      })
    );

    const { carrera: primeraCarrera } = await crearCarreraPrueba(`${sufijo}.a`);
    const { carrera: segundaCarrera } = await crearCarreraPrueba(`${sufijo}.b`);
    carreraA = primeraCarrera;
    carreraB = segundaCarrera;

    await CarreraAsignatura.bulkCreate([
      { carrera_id: carreraA.id, asignatura_id: asignaturas[0].id },
      { carrera_id: carreraB.id, asignatura_id: asignaturas[0].id },
      { carrera_id: carreraA.id, asignatura_id: asignaturas[1].id }
    ]);

    const periodo = await crearPeriodoPrueba(`${sufijo}.periodo`);
    const docente = await crearDocentePrueba(`${sufijo}.docente`);

    await crearCursoPrueba(`${sufijo}.curso1`, {
      asignatura: asignaturas[0],
      periodo,
      docente,
      paralelo: 'A'
    });
    await crearCursoPrueba(`${sufijo}.curso2`, {
      asignatura: asignaturas[0],
      periodo,
      docente,
      paralelo: 'B'
    });
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista asignaturas con paginacion predeterminada', async () => {
    const respuesta = await request(app).get('/api/v1/asignaturas').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.page).toBe(1);
    expect(respuesta.body.limit).toBe(10);
    expect(respuesta.body.total).toBe(totalInicial + CANTIDAD_ASIGNATURAS);
    expect(respuesta.body.totalPages).toBe(Math.ceil(respuesta.body.total / 10));
    expect(respuesta.body.data).toBeInstanceOf(Array);
    expect(respuesta.body.data).toHaveLength(Math.min(10, respuesta.body.total));
  });

  it('aplica page y limit devolviendo una segunda pagina sin solapamiento', async () => {
    const primeraPagina = await request(app)
      .get(`/api/v1/asignaturas?nombre=${sufijo}&page=1&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const segundaPagina = await request(app)
      .get(`/api/v1/asignaturas?nombre=${sufijo}&page=2&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(primeraPagina.body.page).toBe(1);
    expect(segundaPagina.body.page).toBe(2);
    expect(primeraPagina.body.data).toHaveLength(10);
    expect(segundaPagina.body.data).toHaveLength(3);

    const idsPrimeraPagina = primeraPagina.body.data.map((asignatura) => asignatura.id);
    const idsSegundaPagina = segundaPagina.body.data.map((asignatura) => asignatura.id);
    const idsEsperados = asignaturas.map((asignatura) => asignatura.id).sort((a, b) => a - b);

    expect(idsPrimeraPagina.filter((id) => idsSegundaPagina.includes(id))).toEqual([]);
    expect([...idsPrimeraPagina, ...idsSegundaPagina].sort((a, b) => a - b)).toEqual(idsEsperados);
  });

  it('calcula total y totalPages con limite personalizado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?nombre=${sufijo}&limit=5`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.body.total).toBe(CANTIDAD_ASIGNATURAS);
    expect(respuesta.body.totalPages).toBe(3);
    expect(respuesta.body.limit).toBe(5);
    expect(respuesta.body.data).toHaveLength(5);
  });

  it('filtra por codigo parcial', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?codigo=${codigoAsignatura(1).slice(0, 5)}&nombre=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].codigo).toBe(codigoAsignatura(1));
  });

  it('filtra por nombre parcial', async () => {
    const respuesta = await request(app)
      .get('/api/v1/asignaturas?nombre=Programacion')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const asignaturasEsperadas = asignaturas.filter((asignatura) => asignatura.nombre.includes('Programacion'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(asignaturasEsperadas.length);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((asignatura) => expect(asignatura.nombre).toContain('Programacion'));
  });

  it('filtra por creditos exactos', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?creditos=4&nombre=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const asignaturasEsperadas = asignaturas.filter((asignatura) => asignatura.creditos === 4);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(asignaturasEsperadas.length);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((asignatura) => expect(asignatura.creditos).toBe(4));
  });

  it('filtra por nivel academico exacto', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?nivel_academico=1&nombre=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const asignaturasEsperadas = asignaturas.filter((asignatura) => asignatura.nivel_academico === 1);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(asignaturasEsperadas.length);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((asignatura) => expect(asignatura.nivel_academico).toBe(1));
  });

  it('filtra por estado activo', async () => {
    const activas = await request(app)
      .get(`/api/v1/asignaturas?nombre=${sufijo}&activo=true`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inactivas = await request(app)
      .get(`/api/v1/asignaturas?nombre=${sufijo}&activo=false`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadActivas = asignaturas.filter((asignatura) => asignatura.activo).length;

    expect(activas.status).toBe(200);
    expect(inactivas.status).toBe(200);
    expect(activas.body.total).toBe(cantidadActivas);
    expect(activas.body.total).toBeGreaterThan(0);
    expect(inactivas.body.total).toBe(CANTIDAD_ASIGNATURAS - cantidadActivas);
    activas.body.data.forEach((asignatura) => expect(asignatura.activo).toBe(true));
    inactivas.body.data.forEach((asignatura) => expect(asignatura.activo).toBe(false));
  });

  it('combina filtros de nivel, estado y nombre', async () => {
    const respuesta = await request(app)
      .get('/api/v1/asignaturas?nivel_academico=1&activo=true&nombre=Programacion')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const asignaturasEsperadas = asignaturas.filter(
      (asignatura) =>
        asignatura.nivel_academico === 1
        && asignatura.activo
        && asignatura.nombre.includes('Programacion')
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(asignaturasEsperadas.length);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((asignatura) => {
      expect(asignatura.nivel_academico).toBe(1);
      expect(asignatura.activo).toBe(true);
      expect(asignatura.nombre).toContain('Programacion');
    });
  });

  it('devuelve una pagina vacia cuando no hay resultados', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?nombre=${sufijo}&page=99`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual([]);
    expect(respuesta.body.total).toBe(CANTIDAD_ASIGNATURAS);
    expect(respuesta.body.totalPages).toBe(2);
  });

  it('conserva la relacion con carreras en el listado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?codigo=${codigoAsignatura(2)}&nombre=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const asignatura = respuesta.body.data[0];

    expect(respuesta.status).toBe(200);
    expect(asignatura.carreras).toBeTruthy();
    expect(asignatura.carreras.length).toBe(1);
    expect(asignatura.carreras[0].id).toBe(carreraA.id);
    expect(asignatura.carreras[0].codigo).toBeTruthy();
    expect(asignatura.carreras[0].nombre).toBeTruthy();
    expect(asignatura.carreras[0].activo).toBe(true);
  });

  it('conserva la relacion con cursos en el listado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?codigo=${codigoAsignatura(1)}&nombre=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const asignatura = respuesta.body.data[0];

    expect(respuesta.status).toBe(200);
    expect(asignatura.cursos).toBeTruthy();
    expect(asignatura.cursos.length).toBe(2);
    asignatura.cursos.forEach((curso) => {
      expect(curso.id).toBeTruthy();
      expect(curso.paralelo).toBeTruthy();
      expect(curso.estado).toBeTruthy();
    });
  });

  it('no duplica asignaturas ni relaciones cuando existen varias', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/asignaturas?codigo=${codigoAsignatura(1)}&nombre=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data).toHaveLength(1);

    const asignatura = respuesta.body.data[0];
    const idsCarreras = asignatura.carreras.map((carrera) => carrera.id);
    const idsCursos = asignatura.cursos.map((curso) => curso.id);

    expect(idsCarreras).toHaveLength(2);
    expect(idsCursos).toHaveLength(2);
    expect(new Set(idsCarreras).size).toBe(2);
    expect(new Set(idsCursos).size).toBe(2);
  });

  it('rechaza page invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/asignaturas?page=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza limit invalido o superior al maximo', async () => {
    const valoresInvalidos = [0, -1, 'abc'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/asignaturas?limit=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }

    const excedido = await request(app)
      .get('/api/v1/asignaturas?limit=101')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(excedido.status).toBe(400);
  });

  it('rechaza creditos invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/asignaturas?creditos=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza nivel academico invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/asignaturas?nivel_academico=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza activo invalido', async () => {
    const valoresInvalidos = ['si', 'verdadero', 'activas'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/asignaturas?activo=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza filtros desconocidos en el listado', async () => {
    const respuesta = await request(app)
      .get('/api/v1/asignaturas?estado=ACTIVA')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(400);
  });

  it('rechaza el acceso sin autenticacion', async () => {
    const respuesta = await request(app).get('/api/v1/asignaturas');

    expect(respuesta.status).toBe(401);
  });
});
