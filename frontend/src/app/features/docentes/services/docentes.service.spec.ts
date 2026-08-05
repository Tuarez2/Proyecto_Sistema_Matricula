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

  it('listarDocentes ejecuta GET contra la API real configurada', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarDocentes());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
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

  it('getDocentes mantiene compatibilidad y filtra por estado legado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.getDocentes({ estado: 'ACTIVO' }),
    );
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    solicitud.flush(crearRespuestaListado([
      crearDocente({ id: 1, activo: true }),
      crearDocente({ id: 2, activo: false }),
    ]));

    await expect(promesaRespuesta).resolves.toEqual([
      expect.objectContaining({ id: 1 }),
    ]);
  });

  it('getDocentes filtra localmente por busqueda y especialidad', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.getDocentes({ busqueda: 'vera', especialidad: 'Matemática' }),
    );
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('docentes'));

    solicitud.flush(crearRespuestaListado([
      crearDocente({ id: 1, apellidos: 'Vera', especialidad: 'Matemática' }),
      crearDocente({ id: 2, apellidos: 'Vera', especialidad: 'Programación' }),
      crearDocente({
        id: 3,
        nombres: 'Luis',
        apellidos: 'López',
        correo: 'luis.lopez@universidad.edu',
        especialidad: 'Matemática',
      }),
    ]));

    await expect(promesaRespuesta).resolves.toEqual([
      expect.objectContaining({ id: 1 }),
    ]);
  });
});

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
