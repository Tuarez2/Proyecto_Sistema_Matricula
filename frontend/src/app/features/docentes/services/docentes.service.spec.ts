import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  Docente,
  RespuestaDocente,
  RespuestaListadoDocentes,
  SolicitudCrearDocente,
} from '../models/docente.model';
import { DocentesService } from './docentes.service';

describe('DocentesService', () => {
  let servicio: DocentesService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(DocentesService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listarDocentes ejecuta GET contra la URL centralizada sin parámetros inventados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarDocentes());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía page y limit', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ pagina: 2, limite: 25 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('25');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía el filtro de identificación', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ identificacion: '1002003004' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('identificacion')).toBe('1002003004');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía el filtro de nombres', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('nombres')).toBe('Ana');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía el filtro de apellidos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ apellidos: 'Vera' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('apellidos')).toBe('Vera');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía el filtro de correo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ correo: 'ana.vera' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('correo')).toBe('ana.vera');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía el filtro de especialidad', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ especialidad: 'Matemática' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('especialidad')).toBe('Matemática');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía el filtro de activo como booleano', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ activo: true }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('activo')).toBe('true');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes envía activo falso', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({ activo: false }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('activo')).toBe('false');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes omite filtros vacíos y undefined', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({
        identificacion: '   ',
        nombres: undefined,
        apellidos: undefined,
        correo: undefined,
        especialidad: undefined,
        activo: undefined,
        pagina: undefined,
        limite: undefined,
      }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarDocentes combina filtros y paginación en una sola solicitud', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarDocentes({
        identificacion: '100200',
        nombres: 'Ana',
        apellidos: 'Vera',
        correo: 'ana',
        especialidad: 'Matemática',
        activo: false,
        pagina: 2,
        limite: 50,
      }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('identificacion')).toBe('100200');
    expect(solicitud.request.params.get('nombres')).toBe('Ana');
    expect(solicitud.request.params.get('apellidos')).toBe('Vera');
    expect(solicitud.request.params.get('correo')).toBe('ana');
    expect(solicitud.request.params.get('especialidad')).toBe('Matemática');
    expect(solicitud.request.params.get('activo')).toBe('false');
    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('50');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerDocente consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerDocente(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes/15'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaDocente());
    await promesaRespuesta;
  });

  it('crearDocente envia el payload real del backend', async () => {
    const solicitudCrear = crearSolicitudDocente();
    const promesaRespuesta = firstValueFrom(
      servicio.crearDocente(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    solicitud.flush(crearRespuestaDocente());
    await promesaRespuesta;
  });

  it('actualizarDocente ejecuta PUT con campos permitidos', async () => {
    const cuerpo = {
      correo: 'actualizado@universidad.edu',
      telefono: null,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarDocente(15, cuerpo),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes/15'));

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaDocente());
    await promesaRespuesta;
  });

  it('cambiarEstadoDocente inactiva mediante DELETE', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.cambiarEstadoDocente(15, false),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes/15'));

    expect(solicitud.request.method).toBe('DELETE');
    solicitud.flush(crearRespuestaDocente({ activo: false }));
    await promesaRespuesta;
  });

  it('cambiarEstadoDocente activa mediante PUT con activo verdadero', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.cambiarEstadoDocente(15, true),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes/15'));

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual({ activo: true });
    solicitud.flush(crearRespuestaDocente({ activo: true }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarDocentes());
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function esperarSolicitudListado(peticion: { url: string }): boolean {
  return peticion.url === obtenerUrlApi('docentes');
}

function crearSolicitudDocente(
  cambios: Partial<SolicitudCrearDocente> = {},
): SolicitudCrearDocente {
  return {
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    especialidad: 'Matemática',
    activo: true,
    ...cambios,
  };
}

function crearDocente(cambios: Partial<Docente> = {}): Docente {
  return {
    id: 15,
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    especialidad: 'Matemática',
    activo: true,
    ...cambios,
  };
}

function crearRespuestaListado(
  docentes: Docente[] = [crearDocente()],
): RespuestaListadoDocentes {
  return {
    success: true,
    data: docentes,
    page: 1,
    limit: 10,
    total: docentes.length,
    totalPages: Math.ceil(docentes.length / 10),
  };
}

function crearRespuestaDocente(
  cambios: Partial<Docente> = {},
): RespuestaDocente {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearDocente(cambios),
  };
}
