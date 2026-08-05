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

  it('listarAsignaturas ejecuta GET contra la URL centralizada sin parámetros inventados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarAsignaturas());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('asignaturas'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas envía page y limit', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({ pagina: 2, limite: 25 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('25');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas envía el filtro de código', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({ codigo: 'PRG1' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('codigo')).toBe('PRG1');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas envía el filtro de nombre', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({ nombre: 'Programación' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('nombre')).toBe('Programación');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas envía el filtro de créditos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({ creditos: 4 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('creditos')).toBe('4');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas envía el filtro de nivel académico', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({ nivel_academico: 2 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('nivel_academico')).toBe('2');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas envía el filtro de activo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({ activo: false }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('activo')).toBe('false');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas omite filtros vacíos y undefined', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({
        codigo: '   ',
        nombre: undefined,
        creditos: undefined,
        nivel_academico: undefined,
        activo: undefined,
        pagina: undefined,
        limite: undefined,
      }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('asignaturas'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarAsignaturas combina filtros y paginación en una sola solicitud', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarAsignaturas({
        codigo: 'PRG',
        nombre: 'Programación',
        creditos: 4,
        nivel_academico: 1,
        activo: true,
        pagina: 3,
        limite: 50,
      }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('codigo')).toBe('PRG');
    expect(solicitud.request.params.get('nombre')).toBe('Programación');
    expect(solicitud.request.params.get('creditos')).toBe('4');
    expect(solicitud.request.params.get('nivel_academico')).toBe('1');
    expect(solicitud.request.params.get('activo')).toBe('true');
    expect(solicitud.request.params.get('page')).toBe('3');
    expect(solicitud.request.params.get('limit')).toBe('50');
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

function esperarSolicitudListado(peticion: { url: string }): boolean {
  return peticion.url === obtenerUrlApi('asignaturas');
}

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
    page: 1,
    limit: 10,
    total: asignaturas.length,
    totalPages: Math.ceil(asignaturas.length / 10),
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
