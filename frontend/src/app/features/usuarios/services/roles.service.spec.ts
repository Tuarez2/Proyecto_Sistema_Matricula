import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type { RespuestaRoles, Rol } from '../models/rol.model';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let servicio: RolesService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(RolesService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('se crea', () => {
    expect(servicio).toBeTruthy();
  });

  it('ejecuta GET roles', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('roles'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaRoles());
    await promesaRespuesta;
  });

  it('no agrega parametros', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('roles'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaRoles());
    await promesaRespuesta;
  });

  it('devuelve los roles', async () => {
    const respuesta = crearRespuestaRoles();
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    controladorHttp.expectOne(obtenerUrlApi('roles')).flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('conserva descripcion null', async () => {
    const respuesta = crearRespuestaRoles([
      {
        id: 2,
        codigo: 'DOCENTE',
        nombre: 'Docente',
        descripcion: null,
        activo: true,
      },
    ]);
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    controladorHttp.expectOne(obtenerUrlApi('roles')).flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
    expect(respuesta.data?.[0]?.descripcion).toBeNull();
  });

  it('propaga errores', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    controladorHttp
      .expectOne(obtenerUrlApi('roles'))
      .flush({}, { status: 500, statusText: 'Error' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    controladorHttp.expectOne(obtenerUrlApi('roles')).flush(crearRespuestaRoles());
    await promesaRespuesta;
  });

  it('no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarRoles());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('roles'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaRoles());
    await promesaRespuesta;
  });
});

function crearRespuestaRoles(roles: Rol[] = [crearRol()]): RespuestaRoles {
  return {
    success: true,
    data: roles,
  };
}

function crearRol(): Rol {
  return {
    id: 1,
    codigo: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Administración del sistema',
    activo: true,
  };
}
