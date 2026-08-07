import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { obtenerTokenAdministrador } from '../helpers/autenticacion.js';
import { limpiarDatosPrueba } from '../helpers/baseDatos.js';
import { crearCarreraPrueba, generarSufijoPrueba } from '../helpers/datosPrueba.js';

const sufijo = generarSufijoPrueba('validaciones-nucleo');
let tokenAdministrador;
let carrera;

const cuerpoEstudianteValido = ({
  numero = 1,
  identificacion = '1710000001',
  correo = `auditoria.${numero}.${sufijo}@codex.test`
} = {}) => ({
  carrera_id: carrera.id,
  numero_matricula: `MAT_AUD_${numero}_${sufijo}`.slice(0, 30),
  identificacion,
  nombres: 'Maria',
  apellidos: 'Fernandez Rojas',
  correo,
  telefono: '0999000001',
  fecha_nacimiento: '2000-01-01',
  nivel_academico_actual: 1
});

const cuerpoDocenteValido = ({
  numero = 1,
  identificacion = '1710000003',
  correo = `docente.aud.${numero}.${sufijo}@codex.test`
} = {}) => ({
  identificacion,
  nombres: 'Carlos',
  apellidos: 'Andrade Paredes',
  correo,
  telefono: '0999000003',
  especialidad: 'Matematicas'
});

const crearEstudiante = (cuerpo) =>
  request(app).post('/api/v1/estudiantes').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

const crearDocente = (cuerpo) =>
  request(app).post('/api/v1/docentes').set('Authorization', `Bearer ${tokenAdministrador}`).send(cuerpo);

describe('Validaciones de nucleo del sistema', () => {
  beforeAll(async () => {
    tokenAdministrador = await obtenerTokenAdministrador();
    const carreraCreada = await crearCarreraPrueba(sufijo);
    carrera = carreraCreada.carrera;
  });

  afterAll(async () => {
    await limpiarDatosPrueba(sufijo);
  });

  describe('Estudiantes', () => {
    it('crea un estudiante valido', async () => {
      const respuesta = await crearEstudiante(cuerpoEstudianteValido({ numero: 1 }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data.identificacion).toBe('1710000001');
    });

    it('rechaza una identificacion compuesta solo por letras', async () => {
      const respuesta = await crearEstudiante(
        cuerpoEstudianteValido({ numero: 2, identificacion: 'mnbvcxsdfghjkmnbvc' })
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza una identificacion con caracteres especiales', async () => {
      const respuesta = await crearEstudiante(cuerpoEstudianteValido({ numero: 3, identificacion: '171@456789' }));

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza un telefono compuesto por letras', async () => {
      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 4, identificacion: '1710000004' }),
        telefono: 'dfghjkjhgfds'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza una fecha de nacimiento futura', async () => {
      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 5, identificacion: '1710000005' }),
        fecha_nacimiento: '2999-01-01'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza una fecha de nacimiento con edad menor a la minima', async () => {
      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 6, identificacion: '1710000006' }),
        fecha_nacimiento: '2021-01-01'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza nombres compuestos solo por espacios', async () => {
      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 7, identificacion: '1710000007' }),
        nombres: '   '
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza un correo con formato invalido', async () => {
      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 8, identificacion: '1710000008' }),
        correo: 'correo-invalido'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza un numero de matricula vacio', async () => {
      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 9, identificacion: '1710000009' }),
        numero_matricula: '   '
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza un id de estudiante no numerico', async () => {
      const respuesta = await request(app)
        .get('/api/v1/estudiantes/abc')
        .set('Authorization', `Bearer ${tokenAdministrador}`);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('devuelve 409 al duplicar una identificacion', async () => {
      await crearEstudiante(cuerpoEstudianteValido({ numero: 10, identificacion: '1710000010' }));

      const respuesta = await crearEstudiante({
        ...cuerpoEstudianteValido({ numero: 11, identificacion: '1710000010' }),
        correo: `auditoria.dup.${sufijo}@codex.test`
      });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe('UNIQUE_CONSTRAINT_ERROR');
    });

    it('devuelve 409 al duplicar un correo', async () => {
      const correoDuplicado = `auditoria.dupcorreo.${sufijo}@codex.test`;
      await crearEstudiante(cuerpoEstudianteValido({ numero: 12, identificacion: '1710000012', correo: correoDuplicado }));

      const respuesta = await crearEstudiante(
        cuerpoEstudianteValido({ numero: 13, identificacion: '1710000013', correo: correoDuplicado })
      );

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe('UNIQUE_CONSTRAINT_ERROR');
    });
  });

  describe('Docentes', () => {
    it('crea un docente valido', async () => {
      const respuesta = await crearDocente(cuerpoDocenteValido({ numero: 1 }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data.identificacion).toBe('1710000003');
    });

    it('rechaza una identificacion compuesta solo por letras', async () => {
      const respuesta = await crearDocente(
        cuerpoDocenteValido({ numero: 2, identificacion: 'mnbvcxsdfghjkmnbvc' })
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza un telefono compuesto por letras', async () => {
      const respuesta = await crearDocente({
        ...cuerpoDocenteValido({ numero: 3, identificacion: '1710000004' }),
        telefono: 'dfghjkjhgfds'
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });

    it('rechaza una especialidad vacia', async () => {
      const respuesta = await crearDocente({
        ...cuerpoDocenteValido({ numero: 4, identificacion: '1710000005' }),
        especialidad: '   '
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('REQUEST_VALIDATION_ERROR');
    });
  });
});
