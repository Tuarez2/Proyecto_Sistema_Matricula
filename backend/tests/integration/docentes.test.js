import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { ROLE_CODES } from '../../src/constants/domain.constants.js';
import { Docente } from '../../src/models/index.js';
import { obtenerTokenAdministrador, obtenerTokenUsuarioComun } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('docentes');
const CANTIDAD_DOCENTES = 13;
let tokenAdministrador;
let totalInicial;
let docentes;

const identificacionDocente = (numero) => `17${String(numero).padStart(8, '0')}`.slice(0, 20);
const nombreDocente = (numero) => `Docente ${String(numero).padStart(2, '0')}`;
const apellidoDocente = (numero) => `Prueba ${String(numero).padStart(2, '0')}`;
const correoDocente = (numero) => `docente.${numero}.${sufijo}@codex.test`;
const especialidadDocente = (numero) => {
  if (numero % 3 === 1) {
    return 'Matematica';
  }

  if (numero % 3 === 2) {
    return 'Programacion';
  }

  return 'Redes';
};
const esActivo = (numero) => numero % 3 !== 0;

describe('Docentes', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    totalInicial = await Docente.count();

    docentes = await Docente.bulkCreate(
      Array.from({ length: CANTIDAD_DOCENTES }, (_, indice) => {
        const numero = indice + 1;

        return {
          identificacion: identificacionDocente(numero),
          nombres: nombreDocente(numero),
          apellidos: apellidoDocente(numero),
          correo: correoDocente(numero),
          telefono: `09${String(numero).padStart(8, '0')}`,
          especialidad: especialidadDocente(numero),
          activo: esActivo(numero)
        };
      })
    );
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  it('lista docentes con paginacion predeterminada', async () => {
    const respuesta = await request(app).get('/api/v1/docentes').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data).toBeInstanceOf(Array);
    expect(respuesta.body.data).toHaveLength(Math.min(10, respuesta.body.total));
    expect(respuesta.body.total).toBe(totalInicial + CANTIDAD_DOCENTES);
  });

  it('responde con el formato paginado completo', async () => {
    const respuesta = await request(app).get('/api/v1/docentes').set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.page).toBe(1);
    expect(respuesta.body.limit).toBe(10);
    expect(respuesta.body.total).toBeGreaterThanOrEqual(CANTIDAD_DOCENTES);
    expect(respuesta.body.totalPages).toBe(Math.ceil(respuesta.body.total / 10));
    expect(respuesta.body.data[0]).toHaveProperty('id');
    expect(respuesta.body.data[0]).toHaveProperty('identificacion');
    expect(respuesta.body.data[0]).toHaveProperty('nombres');
    expect(respuesta.body.data[0]).toHaveProperty('apellidos');
    expect(respuesta.body.data[0]).toHaveProperty('correo');
    expect(respuesta.body.data[0]).toHaveProperty('especialidad');
    expect(respuesta.body.data[0]).toHaveProperty('activo');
  });

  it('aplica page y limit devolviendo una segunda pagina sin solapamiento', async () => {
    const primeraPagina = await request(app)
      .get(`/api/v1/docentes?correo=${sufijo}&page=1&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const segundaPagina = await request(app)
      .get(`/api/v1/docentes?correo=${sufijo}&page=2&limit=10`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(primeraPagina.body.page).toBe(1);
    expect(segundaPagina.body.page).toBe(2);
    expect(primeraPagina.body.total).toBe(CANTIDAD_DOCENTES);
    expect(primeraPagina.body.totalPages).toBe(2);
    expect(primeraPagina.body.data).toHaveLength(10);
    expect(segundaPagina.body.data).toHaveLength(3);

    const idsPrimeraPagina = primeraPagina.body.data.map((docente) => docente.id);
    const idsSegundaPagina = segundaPagina.body.data.map((docente) => docente.id);
    const idsEsperados = docentes.map((docente) => docente.id).sort((a, b) => a - b);

    expect(idsPrimeraPagina.filter((id) => idsSegundaPagina.includes(id))).toEqual([]);
    expect([...idsPrimeraPagina, ...idsSegundaPagina].sort((a, b) => a - b)).toEqual(idsEsperados);
  });

  it('calcula total y totalPages con limite personalizado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?correo=${sufijo}&limit=5`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.limit).toBe(5);
    expect(respuesta.body.total).toBe(CANTIDAD_DOCENTES);
    expect(respuesta.body.totalPages).toBe(3);
    expect(respuesta.body.data).toHaveLength(5);
  });

  it('filtra parcialmente por identificacion', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?identificacion=${identificacionDocente(5)}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].identificacion).toBe(identificacionDocente(5));
  });

  it('filtra parcialmente por nombres', async () => {
    const respuesta = await request(app)
      .get('/api/v1/docentes?nombres=Docente%2007')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].nombres).toBe(nombreDocente(7));
  });

  it('filtra parcialmente por apellidos', async () => {
    const respuesta = await request(app)
      .get('/api/v1/docentes?apellidos=Prueba%2008')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].apellidos).toBe(apellidoDocente(8));
  });

  it('filtra parcialmente por correo', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?correo=docente.9.${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].correo).toBe(correoDocente(9));
  });

  it('filtra parcialmente por especialidad', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?especialidad=Programacion&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadProgramacion = docentes.filter((docente) => docente.especialidad === 'Programacion').length;

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(cantidadProgramacion);
    expect(respuesta.body.total).toBeGreaterThan(0);
    respuesta.body.data.forEach((docente) => {
      expect(docente.especialidad).toBe('Programacion');
    });
  });

  it('filtra por estado activo', async () => {
    const activos = await request(app)
      .get(`/api/v1/docentes?activo=true&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);
    const inactivos = await request(app)
      .get(`/api/v1/docentes?activo=false&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const cantidadActivos = docentes.filter((docente) => docente.activo).length;
    const cantidadInactivos = docentes.filter((docente) => !docente.activo).length;

    expect(activos.status).toBe(200);
    expect(inactivos.status).toBe(200);
    expect(activos.body.total).toBe(cantidadActivos);
    expect(inactivos.body.total).toBe(cantidadInactivos);
    expect(activos.body.total).toBeGreaterThan(0);
    expect(inactivos.body.total).toBeGreaterThan(0);
    activos.body.data.forEach((docente) => {
      expect(docente.activo).toBe(true);
    });
    inactivos.body.data.forEach((docente) => {
      expect(docente.activo).toBe(false);
    });
  });

  it('combina filtros de estado, especialidad y apellidos', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?activo=true&especialidad=Programacion&apellidos=Prueba&correo=${sufijo}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(4);
    respuesta.body.data.forEach((docente) => {
      expect(docente.activo).toBe(true);
      expect(docente.especialidad).toBe('Programacion');
      expect(docente.apellidos).toContain('Prueba');
    });
  });

  it('devuelve una pagina vacia cuando no hay resultados', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?correo=${sufijo}&page=99`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual([]);
    expect(respuesta.body.total).toBe(CANTIDAD_DOCENTES);
    expect(respuesta.body.totalPages).toBe(2);
  });

  it('no duplica docentes en el listado', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?correo=${sufijo}&limit=100`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const ids = respuesta.body.data.map((docente) => docente.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(CANTIDAD_DOCENTES);
    expect(ids).toHaveLength(CANTIDAD_DOCENTES);
    expect(new Set(ids).size).toBe(CANTIDAD_DOCENTES);
  });

  it('aplica un orden estable por apellidos, nombres e id', async () => {
    const respuesta = await request(app)
      .get(`/api/v1/docentes?correo=${sufijo}&limit=100`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    const ids = respuesta.body.data.map((docente) => docente.id);
    const idsOrdenados = docentes.map((docente) => docente.id).sort((a, b) => a - b);

    expect(respuesta.status).toBe(200);
    expect(ids).toEqual(idsOrdenados);
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
  });

  it('rechaza page invalido', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/docentes?page=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza limit invalido o superior al maximo', async () => {
    const valoresInvalidos = [0, -1, 'abc', '1.5'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/docentes?limit=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }

    const excedido = await request(app)
      .get('/api/v1/docentes?limit=101')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(excedido.status).toBe(400);
  });

  it('rechaza activo invalido', async () => {
    const valoresInvalidos = ['si', 'no', '1', '0', '2', 'activo'];

    for (const valor of valoresInvalidos) {
      const respuesta = await request(app)
        .get(`/api/v1/docentes?activo=${valor}`)
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
    }
  });

  it('rechaza parametros desconocidos en el listado', async () => {
    const respuesta = await request(app)
      .get('/api/v1/docentes?estado=activo')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.status).toBe(400);
  });

  it('rechaza el acceso sin autenticacion', async () => {
    const respuesta = await request(app).get('/api/v1/docentes');

    expect(respuesta.status).toBe(401);
  });

  it('permite el acceso a los roles autenticados', async () => {
    const estudiante = await obtenerTokenUsuarioComun(`${sufijo}.estudiante`);
    const docente = await obtenerTokenUsuarioComun(`${sufijo}.docente`, { codigoRol: ROLE_CODES.TEACHER });

    const respuestaEstudiante = await request(app)
      .get('/api/v1/docentes')
      .set('Authorization', `Bearer ${estudiante.token}`);
    const respuestaDocente = await request(app)
      .get('/api/v1/docentes')
      .set('Authorization', `Bearer ${docente.token}`);

    expect(respuestaEstudiante.status).toBe(200);
    expect(respuestaDocente.status).toBe(200);
  });
});
