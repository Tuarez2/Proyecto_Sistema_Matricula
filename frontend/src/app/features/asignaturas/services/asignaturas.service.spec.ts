import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  Asignatura,
  RespuestaAsignatura,
  RespuestaListadoAsignaturas,
  SolicitudCrearAsignatura,
} from '../models/asignatura.model';
import { AsignaturasService } from './asignaturas.service';

describe('AsignaturasService', () => {
  let servicio: AsignaturasService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(AsignaturasService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listarAsignaturas ejecuta GET contra la API real sin parámetros inventados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarAsignaturas());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('asignaturas'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerAsignatura consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerAsignatura(7));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('asignaturas/7'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaAsignatura());
    await promesaRespuesta;
  });

  it('crearAsignatura envía el payload exacto sin relaciones ficticias', async () => {
    const solicitudCrear: SolicitudCrearAsignatura = {
      codigo: 'PRG1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.crearAsignatura(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('asignaturas'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    expect(solicitud.request.body).not.toHaveProperty('carreras');
    solicitud.flush(crearRespuestaAsignatura());
    await promesaRespuesta;
  });

  it('actualizarAsignatura ejecuta PUT con campos editables', async () => {
    const cuerpo = {
      codigo: 'PRG2',
      nombre: 'Programación II',
      creditos: 5,
      nivel_academico: 2,
      activo: true,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarAsignatura(7, cuerpo),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('asignaturas/7'),
    );

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaAsignatura(cuerpo));
    await promesaRespuesta;
  });

  it('inactivarAsignatura usa DELETE porque el backend implementa inactivación lógica', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.inactivarAsignatura(7),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('asignaturas/7'),
    );

    expect(solicitud.request.method).toBe('DELETE');
    expect(solicitud.request.body).toBeNull();
    solicitud.flush(crearRespuestaAsignatura({ activo: false }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarAsignaturas());
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('asignaturas'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 7,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    carreras: [
      {
        id: 2,
        codigo: 'SOF',
        nombre: 'Ingeniería de Software',
        activo: true,
      },
    ],
    cursos: [
      {
        id: 11,
        paralelo: 'A',
        aula: 'A101',
        horario: 'Lunes 07:00 - 09:00',
        estado: 'abierto',
        cupo_maximo: 40,
      },
    ],
    ...cambios,
  };
}

function crearRespuestaListado(
  asignaturas: Asignatura[] = [crearAsignatura()],
): RespuestaListadoAsignaturas {
  return {
    success: true,
    data: asignaturas,
  };
}

function crearRespuestaAsignatura(
  cambios: Partial<Asignatura> = {},
): RespuestaAsignatura {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearAsignatura(cambios),
  };
}
