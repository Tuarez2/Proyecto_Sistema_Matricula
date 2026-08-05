import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  AsignacionCurricular,
  RespuestaAsignacion,
  RespuestaAsignaturasCarrera,
  SolicitudActualizarRelacion,
  SolicitudAgregarAsignatura,
} from '../models/malla-curricular.model';
import { MallaCurricularService } from './malla-curricular.service';

describe('MallaCurricularService', () => {
  let servicio: MallaCurricularService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(MallaCurricularService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('consultarAsignaturasCarrera consulta la malla real de la carrera', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.consultarAsignaturasCarrera(7, 1, 100),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) =>
        peticion.url === obtenerUrlApi('carreras/7/asignaturas'),
    );

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('page')).toBe('1');
    expect(solicitud.request.params.get('limit')).toBe('100');
    solicitud.flush(crearRespuestaAsignaturasCarrera());
    await promesaRespuesta;
  });

  it('asignarAsignatura envía el payload exacto de la relación', async () => {
    const solicitudAgregar: SolicitudAgregarAsignatura = {
      carrera_id: 7,
      asignatura_id: 3,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.asignarAsignatura(solicitudAgregar),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('carrera-asignaturas'),
    );

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudAgregar);
    expect(solicitud.request.body).not.toHaveProperty('carrera');
    expect(solicitud.request.body).not.toHaveProperty('asignatura');
    solicitud.flush(crearRespuestaAsignacion());
    await promesaRespuesta;
  });

  it('actualizarRelacion ejecuta PUT contra el id compuesto carrera-asignatura', async () => {
    const cuerpo: SolicitudActualizarRelacion = { asignatura_id: 9 };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarRelacion('7-3', cuerpo),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('carrera-asignaturas/7-3'),
    );

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaAsignacion({ asignatura_id: 9 }));
    await promesaRespuesta;
  });

  it('quitarAsignatura elimina la relación con DELETE por id compuesto', async () => {
    const promesaRespuesta = firstValueFrom(servicio.quitarAsignatura('7-3'));

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('carrera-asignaturas/7-3'),
    );

    expect(solicitud.request.method).toBe('DELETE');
    expect(solicitud.request.body).toBeNull();
    solicitud.flush(crearRespuestaAsignacion());
    await promesaRespuesta;
  });

  it('construirIdAsignacion compone el identificador real carrera_id-asignatura_id', () => {
    expect(servicio.construirIdAsignacion(7, 3)).toBe('7-3');
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.consultarAsignaturasCarrera(999999),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) =>
        peticion.url === obtenerUrlApi('carreras/999999/asignaturas'),
    );

    solicitud.flush(
      { success: false, message: 'Carrera no encontrada.' },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 404 });
  });
});

function crearAsignacion(
  cambios: Partial<AsignacionCurricular> = {},
): AsignacionCurricular {
  return {
    id: '7-3',
    carrera_id: 7,
    asignatura_id: 3,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    carrera: {
      id: 7,
      codigo: 'SOF',
      nombre: 'Software',
      duracion_semestres: 8,
      facultad_id: 2,
      activo: true,
    },
    asignatura: {
      id: 3,
      codigo: 'PRO1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaAsignaturasCarrera(): RespuestaAsignaturasCarrera {
  return {
    success: true,
    carrera: {
      id: 7,
      codigo: 'SOF',
      nombre: 'Software',
      duracion_semestres: 8,
      facultad_id: 2,
      activo: true,
    },
    data: [
      {
        id: 3,
        codigo: 'PRO1',
        nombre: 'Programación I',
        creditos: 4,
        nivel_academico: 1,
        activo: true,
      },
    ],
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  };
}

function crearRespuestaAsignacion(
  cambios: Partial<AsignacionCurricular> = {},
): RespuestaAsignacion {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearAsignacion(cambios),
  };
}
