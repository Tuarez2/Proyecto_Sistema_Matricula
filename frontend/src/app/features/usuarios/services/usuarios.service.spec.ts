import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosListadoUsuarios,
  RespuestaListadoUsuarios,
  Usuario,
} from '../models/usuario.model';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let servicio: UsuariosService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(UsuariosService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('se crea', () => {
    expect(servicio).toBeTruthy();
  });

  it('sin filtros ejecuta GET usuarios', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('no envia parametros vacios', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios({
      correo: '   ',
      codigoRol: '',
    }));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('envia correo sin espacios exteriores', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarUsuarios({ correo: '  admin  ' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    );

    expect(solicitud.request.params.get('correo')).toBe('admin');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('envia estado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarUsuarios({ estado: 'activo' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    );

    expect(solicitud.request.params.get('estado')).toBe('activo');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte codigoRol en rol', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarUsuarios({ codigoRol: 'ADMIN' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    );

    expect(solicitud.request.params.get('rol')).toBe('ADMIN');
    expect(solicitud.request.params.has('codigoRol')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte pagina en page', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarUsuarios({ pagina: 2 }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    );

    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.has('pagina')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte limite en limit', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarUsuarios({ limite: 25 }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    );

    expect(solicitud.request.params.get('limit')).toBe('25');
    expect(solicitud.request.params.has('limite')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('envia todos los filtros juntos', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios({
      correo: 'admin',
      estado: 'activo',
      codigoRol: 'ADMIN',
      pagina: 1,
      limite: 10,
    }));

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    );

    expect(solicitud.request.params.get('correo')).toBe('admin');
    expect(solicitud.request.params.get('estado')).toBe('activo');
    expect(solicitud.request.params.get('rol')).toBe('ADMIN');
    expect(solicitud.request.params.get('page')).toBe('1');
    expect(solicitud.request.params.get('limit')).toBe('10');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('no modifica el objeto recibido', async () => {
    const filtros: FiltrosListadoUsuarios = {
      correo: '  admin  ',
      estado: 'activo',
      codigoRol: 'ADMIN',
      pagina: 1,
      limite: 10,
    };
    const filtrosOriginales = { ...filtros };

    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios(filtros));
    controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('usuarios'),
    ).flush(crearRespuestaListado());
    await promesaRespuesta;

    expect(filtros).toEqual(filtrosOriginales);
  });

  it('conserva la respuesta paginada', async () => {
    const respuesta = crearRespuestaListado({ page: 2, total: 12, totalPages: 2 });
    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios());

    controladorHttp.expectOne(obtenerUrlApi('usuarios')).flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('propaga errores HTTP', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios());

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios'))
      .flush({}, { status: 500, statusText: 'Error' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarUsuarios());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });
});

function crearRespuestaListado(
  parcial: Partial<RespuestaListadoUsuarios> = {},
): RespuestaListadoUsuarios {
  return {
    success: true,
    data: [crearUsuario()],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    ...parcial,
  };
}

function crearUsuario(): Usuario {
  return {
    id: 1,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    correo: 'admin@universidad.edu',
    estado: 'activo',
    rol_id: 1,
    estudiante_id: null,
    docente_id: null,
    debe_cambiar_password: false,
    ultimo_acceso: '2026-08-01T20:00:00.000Z',
    created_at: '2026-08-01T20:00:00.000Z',
    updated_at: '2026-08-01T20:00:00.000Z',
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
      activo: true,
    },
    estudiante: null,
    docente: null,
  };
}
