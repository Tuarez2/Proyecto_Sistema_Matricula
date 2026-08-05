import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { Carrera } from '../../src/models/index.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { crearFacultadPrueba, generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('carreras');
const CANTIDAD_CARRERAS = 13;
let tokenAdministrador;
let totalInicial;
let facultadA;
let facultadB;
let carreras;

const esActiva = (numero) => numero % 3 !== 0;
const esIngenieria = (numero) => numero % 2 === 0;
const perteneceFacultadA = (numero) => numero <= 7;

describe('Carreras', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    totalInicial = await Carrera.count();

    facultadA = await crearFacultadPrueba(`${sufijo}.a`);
    facultadB = await crearFacultadPrueba(`${sufijo}.b`);

    carreras = await Carrera.bulkCreate(
      Array.from({ length: CANTIDAD_CARRERAS }, (_, indice) => {
        const numero = indice + 1;

        return {
          codigo: `CAR${String(numero).padStart(2, '0')}_${sufijo}`.slice(0, 20),
          nombre: `${esIngenieria(numero) ? 'Ingenieria de Sistemas' : 'Medicina General'} ${numero} ${sufijo}`,
          duracion_semestres: 8,
          facultad_id: perteneceFacultadA(numero) ? facultadA.id : facultadB.id,
          activo: esActiva(numero)
        };
      })
    );
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista carreras con paginacion predeterminada', async () => {
    const respuesta = await request(app).get('/api/v1/carreras').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.page).toBe(1);
    expect(respuesta.body.limit).toBe(10);
    expect(respuesta.body.total).toBe(totalInicial + CANTIDAD_CARRERAS);
    expect(respuesta.body.totalPages).toBe(Math.ceil(respuesta.body.total / 10));
    expect(respuesta.body.data).toBeInstanceOf(Array);
    expect(respuesta.body.data).toHaveLength(Math.min(10, respuesta.body.total));
  });

  it('aplica page y limit devolviendo una segunda pagina sin solapamiento', async () => {
    const primeraPagina = await request(app)
      .get(`/api/v1/carreras?nombre=${sufijo}&page=1&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const segundaPagina = await request(app)
      .get(`/api/v1/carreras?nombre=${sufijo}&page=2&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(primeraPagina.body.page).toBe(1);
    expect(segundaPagina.body.page).toBe(2);
    expect(primeraPagina.body.limit).toBe(10);
    expect(primeraPagina.body.data).toHaveLength(10);
    expect(segundaPagina.body.data).toHaveLength(3);

    const idsPrimeraPagina = primeraPagina.body.data.map((carrera) => carrera.id);
    const idsSegundaPagina = segundaPagina.body.data.map((carrera) => carrera.id);
    const idsEsperados = carreras.map((carrera) => carrera.id).sort((a, b) => a - b);

    expect(idsPrimeraPagina.filter((id) => idsSegundaPagina.includes(id))).toEqual([]);
    expect([...idsPrimeraPagina, ...idsSegundaPagina].sort((a, b) => a - b)).toEqual(idsEsperados);
  });

  it('calcula total y totalPages con limite personalizado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/carreras?nombre=${sufijo}&limit=5`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.body.total).toBe(CANTIDAD_CARRERAS);
    expect(respuesta.body.totalPages).toBe(3);
    expect(respuesta.body.limit).toBe(5);
    expect(respuesta.body.data).toHaveLength(5);
  });

  it('filtra por codigo parcial', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/carreras?codigo=${carreras[0].codigo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].codigo).toBe(carreras[0].codigo);
  });

  it('filtra por nombre parcial', async () => {
    const respuesta = await request(app)
      .get('/api/v1/carreras?nombre=Ingenieria')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const carrerasEsperadas = carreras.filter((carrera) => carrera.nombre.includes('Ingenieria'));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(carrerasEsperadas.length);
    expect(respuesta.body.data).toHaveLength(carrerasEsperadas.length);
    respuesta.body.data.forEach((carrera) => expect(carrera.nombre).toContain('Ingenieria'));
  });

  it('filtra por facultad', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/carreras?facultad_id=${facultadA.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const carrerasEsperadas = carreras.filter((carrera) => carrera.facultad_id === facultadA.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(carrerasEsperadas.length);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((carrera) => expect(carrera.facultad_id).toBe(facultadA.id));
  });

  it('filtra por estado activo', async () => {
    const activas = await request(app)
      .get(`/api/v1/carreras?nombre=${sufijo}&activo=true`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inactivas = await request(app)
      .get(`/api/v1/carreras?nombre=${sufijo}&activo=false`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadActivas = carreras.filter((carrera) => carrera.activo).length;

    expect(activas.status).toBe(200);
    expect(inactivas.status).toBe(200);
    expect(activas.body.total).toBe(cantidadActivas);
    expect(activas.body.total).toBeGreaterThan(0);
    expect(inactivas.body.total).toBe(CANTIDAD_CARRERAS - cantidadActivas);
    activas.body.data.forEach((carrera) => expect(carrera.activo).toBe(true));
    inactivas.body.data.forEach((carrera) => expect(carrera.activo).toBe(false));
  });

  it('combina filtros de facultad, estado y nombre', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/carreras?facultad_id=${facultadA.id}&activo=true&nombre=Ingenieria`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const carrerasEsperadas = carreras.filter(
      (carrera) =>
        carrera.facultad_id === facultadA.id
        && carrera.activo
        && carrera.nombre.includes('Ingenieria')
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(carrerasEsperadas.length);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((carrera) => {
      expect(carrera.facultad_id).toBe(facultadA.id);
      expect(carrera.activo).toBe(true);
      expect(carrera.nombre).toContain('Ingenieria');
    });
  });

  it('devuelve una pagina vacia cuando no hay resultados', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/carreras?nombre=${sufijo}&page=99`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual([]);
    expect(respuesta.body.total).toBe(CANTIDAD_CARRERAS);
    expect(respuesta.body.totalPages).toBe(2);
  });

  it('rechaza page invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/carreras?page=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza limit invalido o superior al maximo', async () => {
    const valoresInvalidos = [0, -1, 'abc'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/carreras?limit=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }

    const excedido = await request(app)
      .get('/api/v1/carreras?limit=101')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(excedido.status).toBe(400);
  });

  it('rechaza facultad_id invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/carreras?facultad_id=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza activo invalido', async () => {
    const valoresInvalidos = ['si', 'verdadero', 'activas'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/carreras?activo=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza filtros desconocidos en el listado', async () => {
    const respuesta = await request(app)
      .get('/api/v1/carreras?estado=ACTIVO')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(400);
  });

  it('rechaza el acceso sin autenticacion', async () => {
    const respuesta = await request(app).get('/api/v1/carreras');

    expect(respuesta.status).toBe(401);
  });

  it('conserva la relacion con la facultad en el listado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/carreras?codigo=${carreras[0].codigo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const carrera = respuesta.body.data[0];

    expect(respuesta.status).toBe(200);
    expect(carrera.facultad).toBeTruthy();
    expect(carrera.facultad.id).toBe(carrera.facultad_id);
    expect(carrera.facultad.codigo).toBeTruthy();
    expect(carrera.facultad.nombre).toBeTruthy();
    expect(carrera.facultad.activo).toBe(true);
  });
});
