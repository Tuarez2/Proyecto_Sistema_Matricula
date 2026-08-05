import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  Carrera,
  RespuestaCarrera,
  RespuestaListadoCarreras,
  SolicitudCrearCarrera,
} from '../models/carrera.model';
import { CarrerasService } from './carreras.service';

describe('CarrerasService', () => {
  let servicio: CarrerasService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(CarrerasService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listarCarreras ejecuta GET contra la API real sin parámetros inventados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarCarreras());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('carreras'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerCarrera consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerCarrera(7));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('carreras/7'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaCarrera());
    await promesaRespuesta;
  });

  it('crearCarrera envía el payload exacto con facultad_id', async () => {
    const solicitudCrear: SolicitudCrearCarrera = {
      codigo: 'SOF',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: 2,
      activo: true,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.crearCarrera(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('carreras'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    expect(solicitud.request.body).not.toHaveProperty('facultad');
    solicitud.flush(crearRespuestaCarrera());
    await promesaRespuesta;
  });

  it('actualizarCarrera ejecuta PUT con campos editables', async () => {
    const cuerpo = {
      codigo: 'MED',
      nombre: 'Medicina',
      duracion_semestres: 10,
      facultad_id: 3,
      activo: false,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarCarrera(7, cuerpo),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('carreras/7'));

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaCarrera(cuerpo));
    await promesaRespuesta;
  });

  it('inactivarCarrera usa DELETE porque el backend implementa inactivación lógica', async () => {
    const promesaRespuesta = firstValueFrom(servicio.inactivarCarrera(7));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('carreras/7'));

    expect(solicitud.request.method).toBe('DELETE');
    expect(solicitud.request.body).toBeNull();
    solicitud.flush(crearRespuestaCarrera({ activo: false }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarCarreras());
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('carreras'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function crearCarrera(cambios: Partial<Carrera> = {}): Carrera {
  return {
    id: 7,
    codigo: 'SOF',
    nombre: 'Ingeniería de Software',
    duracion_semestres: 8,
    facultad_id: 2,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    facultad: {
      id: 2,
      codigo: 'SIS',
      nombre: 'Sistemas',
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaListado(
  carreras: Carrera[] = [crearCarrera()],
): RespuestaListadoCarreras {
  return {
    success: true,
    data: carreras,
  };
}

function crearRespuestaCarrera(cambios: Partial<Carrera> = {}): RespuestaCarrera {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearCarrera(cambios),
  };
}
