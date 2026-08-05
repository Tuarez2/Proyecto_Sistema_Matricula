import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  Facultad,
  RespuestaFacultad,
  RespuestaListadoFacultades,
  SolicitudCrearFacultad,
} from '../models/facultad.model';
import { FacultadesService } from './facultades.service';

describe('FacultadesService', () => {
  let servicio: FacultadesService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(FacultadesService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listarFacultades ejecuta GET contra la API real configurada', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarFacultades());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('facultades'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarFacultades envia filtros y paginacion con nombres reales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarFacultades({
        codigo: 'sis',
        nombre: 'Ingeniería',
        activo: true,
        pagina: 2,
        limite: 20,
      }),
    );

    const solicitud = controladorHttp.expectOne((peticion) =>
      peticion.url === obtenerUrlApi('facultades'),
    );

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('codigo')).toBe('sis');
    expect(solicitud.request.params.get('nombre')).toBe('Ingeniería');
    expect(solicitud.request.params.get('activo')).toBe('true');
    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('20');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarFacultades no envia filtros vacios o invalidos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarFacultades({
        codigo: '   ',
        nombre: '',
        pagina: 0,
        limite: -1,
      }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('facultades'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerFacultad consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerFacultad(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('facultades/15'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaFacultad());
    await promesaRespuesta;
  });

  it('crearFacultad envia el payload permitido por el backend', async () => {
    const solicitudCrear: SolicitudCrearFacultad = {
      codigo: 'SIS',
      nombre: 'Sistemas',
      activo: true,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.crearFacultad(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('facultades'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    solicitud.flush(crearRespuestaFacultad());
    await promesaRespuesta;
  });

  it('actualizarFacultad ejecuta PUT con campos editables', async () => {
    const cuerpo = {
      codigo: 'MED',
      nombre: 'Medicina',
    };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarFacultad(15, cuerpo),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('facultades/15'));

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaFacultad(cuerpo));
    await promesaRespuesta;
  });

  it('cambiarEstadoFacultad ejecuta PATCH con activo booleano', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.cambiarEstadoFacultad(15, { activo: false }),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('facultades/15/estado'),
    );

    expect(solicitud.request.method).toBe('PATCH');
    expect(solicitud.request.body).toEqual({ activo: false });
    solicitud.flush(crearRespuestaFacultad({ activo: false }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarFacultades());
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('facultades'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function crearFacultad(cambios: Partial<Facultad> = {}): Facultad {
  return {
    id: 15,
    codigo: 'SIS',
    nombre: 'Sistemas',
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    carreras: [
      {
        id: 2,
        codigo: 'SOF',
        nombre: 'Ingeniería de Software',
        duracion_semestres: 8,
        activo: true,
      },
    ],
    ...cambios,
  };
}

function crearRespuestaListado(
  facultades: Facultad[] = [crearFacultad()],
): RespuestaListadoFacultades {
  return {
    success: true,
    data: facultades,
    page: 1,
    limit: 10,
    total: facultades.length,
    totalPages: 1,
  };
}

function crearRespuestaFacultad(
  cambios: Partial<Facultad> = {},
): RespuestaFacultad {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearFacultad(cambios),
  };
}
