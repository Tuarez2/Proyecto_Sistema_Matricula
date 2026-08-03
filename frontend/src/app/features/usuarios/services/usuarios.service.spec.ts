import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  ActualizarUsuarioSolicitud,
  CrearUsuarioSolicitud,
  FiltrosListadoUsuarios,
  RespuestaListadoUsuarios,
  RespuestaUsuario,
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

  it('crearUsuario ejecuta POST usuarios', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario()),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.method).toBe('POST');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia los nombres', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ nombres: 'Ana Maria' })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.nombres).toBe('Ana Maria');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia los apellidos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ apellidos: 'Perez Lopez' })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.apellidos).toBe('Perez Lopez');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia el correo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ correo: 'ana@universidad.edu' })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.correo).toBe('ana@universidad.edu');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia password', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ password: 'clave segura' })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.password).toBe('clave segura');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia estado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ estado: 'bloqueado' })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.estado).toBe('bloqueado');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia rol_id', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ rol_id: 2 })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.rol_id).toBe(2);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia estudiante_id', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ estudiante_id: 3 })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.estudiante_id).toBe(3);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia docente_id', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ docente_id: 4 })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.docente_id).toBe(4);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario envia debe_cambiar_password', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ debe_cambiar_password: false })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.debe_cambiar_password).toBe(false);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario conserva valores null en relaciones opcionales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({
        estudiante_id: null,
        docente_id: null,
      })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.estudiante_id).toBeNull();
    expect(solicitud.request.body.docente_id).toBeNull();
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario conserva una contrasena con espacios interiores', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario({ password: 'clave con espacios' })),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.body.password).toBe('clave con espacios');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario no modifica el objeto recibido', async () => {
    const solicitudUsuario = crearSolicitudUsuario({ nombres: '  Ana  ' });
    const solicitudOriginal = { ...solicitudUsuario };
    const promesaRespuesta = firstValueFrom(servicio.crearUsuario(solicitudUsuario));

    controladorHttp.expectOne(obtenerUrlApi('usuarios')).flush(crearRespuestaUsuario());
    await promesaRespuesta;

    expect(solicitudUsuario).toEqual(solicitudOriginal);
  });

  it('crearUsuario devuelve la respuesta creada', async () => {
    const respuesta = crearRespuestaUsuario();
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario()),
    );

    controladorHttp.expectOne(obtenerUrlApi('usuarios')).flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('crearUsuario propaga un error 400', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario()),
    );

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios'))
      .flush({}, { status: 400, statusText: 'Solicitud incorrecta' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('crearUsuario propaga un error 409', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario()),
    );

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios'))
      .flush({}, { status: 409, statusText: 'Conflicto' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('crearUsuario no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario()),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('crearUsuario no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearUsuario(crearSolicitudUsuario()),
    );

    controladorHttp.expectOne(obtenerUrlApi('usuarios')).flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('obtenerUsuarioPorId ejecuta GET usuarios id', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaUsuario(crearUsuario({ id: 15 })));
    await promesaRespuesta;
  });

  it('obtenerUsuarioPorId no agrega parametros', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('obtenerUsuarioPorId devuelve el usuario', async () => {
    const usuario = crearUsuario({ id: 15 });
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15'))
      .flush(crearRespuestaUsuario(usuario));

    await expect(promesaRespuesta).resolves.toEqual(crearRespuestaUsuario(usuario));
  });

  it('obtenerUsuarioPorId conserva relaciones nulas', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15')).flush(
      crearRespuestaUsuario(crearUsuario({
        estudiante_id: null,
        docente_id: null,
        estudiante: null,
        docente: null,
      })),
    );

    const respuesta = await promesaRespuesta;

    expect(respuesta.data?.estudiante_id).toBeNull();
    expect(respuesta.data?.docente_id).toBeNull();
    expect(respuesta.data?.estudiante).toBeNull();
    expect(respuesta.data?.docente).toBeNull();
  });

  it('obtenerUsuarioPorId conserva el rol', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15')).flush(
      crearRespuestaUsuario(crearUsuario({
        rol: {
          id: 2,
          codigo: 'GESTOR_MATRICULA',
          nombre: 'Gestor de matrícula',
          activo: true,
        },
      })),
    );

    const respuesta = await promesaRespuesta;

    expect(respuesta.data?.rol?.codigo).toBe('GESTOR_MATRICULA');
  });

  it('obtenerUsuarioPorId propaga un error 404', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios/15'))
      .flush({}, { status: 404, statusText: 'No encontrado' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('obtenerUsuarioPorId propaga un error 403', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios/15'))
      .flush({}, { status: 403, statusText: 'Prohibido' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('obtenerUsuarioPorId no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('obtenerUsuarioPorId no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerUsuarioPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15')).flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario ejecuta PUT usuarios id', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.method).toBe('PUT');
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario envia solamente nombres', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.body).toEqual({ nombres: 'Ana' });
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario envia solamente correo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { correo: 'ana@universidad.edu' }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.body).toEqual({ correo: 'ana@universidad.edu' });
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario envia todos los campos editables juntos', async () => {
    const datosUsuario = crearSolicitudActualizacion();
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, datosUsuario),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.body).toEqual(datosUsuario);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario conserva estudiante_id null', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { estudiante_id: null }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.body).toEqual({ estudiante_id: null });
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario conserva docente_id null', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { docente_id: null }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.body).toEqual({ docente_id: null });
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario envia debe_cambiar_password', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { debe_cambiar_password: true }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.body).toEqual({ debe_cambiar_password: true });
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario no agrega estado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect('estado' in solicitud.request.body).toBe(false);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario no agrega password', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect('password' in solicitud.request.body).toBe(false);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario no modifica el objeto recibido', async () => {
    const datosUsuario = crearSolicitudActualizacion({ nombres: '  Ana  ' });
    const datosOriginales = { ...datosUsuario };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, datosUsuario),
    );

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15')).flush(crearRespuestaUsuario());
    await promesaRespuesta;

    expect(datosUsuario).toEqual(datosOriginales);
  });

  it('actualizarUsuario devuelve el usuario actualizado', async () => {
    const usuario = crearUsuario({ nombres: 'Ana' });
    const respuesta = crearRespuestaUsuario(usuario);
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15')).flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('actualizarUsuario propaga un error 400', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios/15'))
      .flush({}, { status: 400, statusText: 'Solicitud incorrecta' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('actualizarUsuario propaga un error 404', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios/15'))
      .flush({}, { status: 404, statusText: 'No encontrado' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('actualizarUsuario propaga un error 409', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    controladorHttp
      .expectOne(obtenerUrlApi('usuarios/15'))
      .flush({}, { status: 409, statusText: 'Conflicto' });

    await expect(promesaRespuesta).rejects.toBeTruthy();
  });

  it('actualizarUsuario no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('usuarios/15'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaUsuario());
    await promesaRespuesta;
  });

  it('actualizarUsuario no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarUsuario(15, { nombres: 'Ana' }),
    );

    controladorHttp.expectOne(obtenerUrlApi('usuarios/15')).flush(crearRespuestaUsuario());
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

function crearUsuario(parcial: Partial<Usuario> = {}): Usuario {
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
    ...parcial,
  };
}

function crearSolicitudUsuario(
  parcial: Partial<CrearUsuarioSolicitud> = {},
): CrearUsuarioSolicitud {
  return {
    nombres: 'Ana Maria',
    apellidos: 'Perez Lopez',
    correo: 'ana.perez@universidad.edu',
    password: 'contrasena-segura',
    estado: 'activo',
    rol_id: 2,
    estudiante_id: null,
    docente_id: null,
    debe_cambiar_password: true,
    ...parcial,
  };
}

function crearSolicitudActualizacion(
  parcial: Partial<ActualizarUsuarioSolicitud> = {},
): ActualizarUsuarioSolicitud {
  return {
    nombres: 'Ana Maria',
    apellidos: 'Perez Lopez',
    correo: 'ana.perez@universidad.edu',
    rol_id: 2,
    estudiante_id: null,
    docente_id: null,
    debe_cambiar_password: true,
    ...parcial,
  };
}

function crearRespuestaUsuario(usuario = crearUsuario()): RespuestaUsuario {
  return {
    success: true,
    message: 'Usuario creado correctamente.',
    data: usuario,
  };
}
