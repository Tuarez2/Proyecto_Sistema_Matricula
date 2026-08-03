import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { obtenerUrlApi } from '../config/configuracion-api';
import type {
  CredencialesInicioSesion,
  DatosAutenticacion,
  RespuestaCierreSesion,
  RespuestaInicioSesion,
  RespuestaPerfilAutenticado,
  RespuestaRenovacionSesion,
  UsuarioAutenticado,
} from '../models/autenticacion.model';
import { AlmacenamientoSesionService } from './almacenamiento-sesion.service';
import { AutenticacionService } from './autenticacion.service';

function crearDatosSesion(sufijo = 'inicial'): DatosAutenticacion {
  return {
    user: {
      id: 1,
      nombres: `Persona ${sufijo}`,
      apellidos: 'Prueba',
      correo: `persona.${sufijo}@universidad.edu`,
      estado: 'ACTIVO',
      debe_cambiar_password: false,
      rol: {
        id: 1,
        codigo: 'ADMIN',
        nombre: 'Administrador',
      },
    },
    tokens: {
      accessToken: `token-acceso-${sufijo}`,
      refreshToken: `token-renovacion-${sufijo}`,
      accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
      refreshTokenExpiresAt: '2026-08-03T11:00:00.000Z',
    },
  };
}

function crearUsuarioActualizado(): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona Actualizada',
    apellidos: 'Prueba',
    correo: 'persona.actualizada@universidad.edu',
    estado: 'ACTIVO',
    debe_cambiar_password: true,
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
  };
}

describe('AutenticacionService', () => {
  let controladorHttp: HttpTestingController | null;

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    controladorHttp = null;
  });

  afterEach(() => {
    controladorHttp?.verify();
    sessionStorage.clear();
  });

  function configurarPrueba(): {
    almacenamientoSesion: AlmacenamientoSesionService;
  } {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    controladorHttp = TestBed.inject(HttpTestingController);

    return {
      almacenamientoSesion: TestBed.inject(AlmacenamientoSesionService),
    };
  }

  it('crea el servicio', () => {
    configurarPrueba();
    const servicio = TestBed.inject(AutenticacionService);

    expect(servicio).toBeTruthy();
  });

  it('inicia sin sesion almacenada', () => {
    configurarPrueba();
    const servicio = TestBed.inject(AutenticacionService);

    expect(servicio.sesionActual()).toBeNull();
    expect(servicio.usuarioActual()).toBeNull();
    expect(servicio.estaAutenticado()).toBe(false);
  });

  it('restaura una sesion almacenada al crearse', () => {
    const datosSesion = crearDatosSesion();
    const { almacenamientoSesion } = configurarPrueba();

    almacenamientoSesion.guardarSesion(datosSesion);
    const servicio = TestBed.inject(AutenticacionService);

    expect(servicio.sesionActual()).toEqual(datosSesion);
    expect(servicio.estaAutenticado()).toBe(true);
  });

  it('inicia sesion enviando credenciales y guardando la sesion devuelta', () => {
    const { almacenamientoSesion } = configurarPrueba();
    const servicio = TestBed.inject(AutenticacionService);
    const credenciales: CredencialesInicioSesion = {
      correo: 'persona.prueba@universidad.edu',
      password: 'clave-ficticia',
    };
    const datosSesion = crearDatosSesion('login');
    const respuesta: RespuestaInicioSesion = {
      success: true,
      message: 'Inicio de sesion correcto.',
      data: datosSesion,
    };
    let respuestaRecibida: RespuestaInicioSesion | undefined;

    servicio.iniciarSesion(credenciales).subscribe((valor) => {
      respuestaRecibida = valor;
    });

    const solicitud = controladorHttp!.expectOne(obtenerUrlApi('auth/login'));
    const cuerpoSolicitud = solicitud.request.body as CredencialesInicioSesion;

    expect(solicitud.request.method).toBe('POST');
    expect(cuerpoSolicitud).toEqual(credenciales);
    expect(Object.keys(cuerpoSolicitud).sort()).toEqual(['correo', 'password']);

    solicitud.flush(respuesta);

    expect(respuestaRecibida).toEqual(respuesta);
    expect(almacenamientoSesion.obtenerSesion()).toEqual(datosSesion);
    expect(servicio.sesionActual()).toEqual(datosSesion);
    expect(servicio.usuarioActual()).toEqual(datosSesion.user);
    expect(servicio.estaAutenticado()).toBe(true);
  });

  it('renueva sesion enviando el refresh token y reemplazando la sesion', () => {
    const datosSesionInicial = crearDatosSesion('anterior');
    const { almacenamientoSesion } = configurarPrueba();

    almacenamientoSesion.guardarSesion(datosSesionInicial);
    const servicio = TestBed.inject(AutenticacionService);

    const datosSesionRenovada = crearDatosSesion('renovada');
    const respuesta: RespuestaRenovacionSesion = {
      success: true,
      message: 'Sesion renovada.',
      data: datosSesionRenovada,
    };
    let respuestaRecibida: RespuestaRenovacionSesion | undefined;

    servicio.renovarSesion().subscribe((valor) => {
      respuestaRecibida = valor;
    });

    const solicitud = controladorHttp!.expectOne(obtenerUrlApi('auth/refresh'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({
      refreshToken: datosSesionInicial.tokens.refreshToken,
    });

    solicitud.flush(respuesta);

    expect(respuestaRecibida).toEqual(respuesta);
    expect(almacenamientoSesion.obtenerSesion()).toEqual(datosSesionRenovada);
    expect(servicio.sesionActual()).toEqual(datosSesionRenovada);
    expect(servicio.obtenerTokenAcceso()).toBe(datosSesionRenovada.tokens.accessToken);
    expect(servicio.obtenerTokenRenovacion()).toBe(
      datosSesionRenovada.tokens.refreshToken,
    );
    expect(servicio.estaAutenticado()).toBe(true);
  });

  it('produce error y no realiza solicitudes al renovar sin refresh token', () => {
    const { almacenamientoSesion } = configurarPrueba();
    const servicio = TestBed.inject(AutenticacionService);
    let errorRecibido: Error | undefined;

    servicio.renovarSesion().subscribe({
      error: (error: Error) => {
        errorRecibido = error;
      },
    });

    controladorHttp!.expectNone(obtenerUrlApi('auth/refresh'));
    expect(errorRecibido?.message).toBe('No existe una sesion valida para renovar.');
    expect(almacenamientoSesion.obtenerSesion()).toBeNull();
    expect(servicio.sesionActual()).toBeNull();
    expect(servicio.estaAutenticado()).toBe(false);
  });

  it('consulta el perfil y conserva los tokens anteriores', () => {
    const datosSesion = crearDatosSesion('perfil');
    const { almacenamientoSesion } = configurarPrueba();

    almacenamientoSesion.guardarSesion(datosSesion);
    const servicio = TestBed.inject(AutenticacionService);

    const usuarioActualizado = crearUsuarioActualizado();
    const respuesta: RespuestaPerfilAutenticado = {
      success: true,
      data: {
        user: usuarioActualizado,
      },
    };
    let respuestaRecibida: RespuestaPerfilAutenticado | undefined;

    servicio.consultarPerfil().subscribe((valor) => {
      respuestaRecibida = valor;
    });

    const solicitud = controladorHttp!.expectOne(obtenerUrlApi('auth/me'));

    expect(solicitud.request.method).toBe('GET');

    solicitud.flush(respuesta);

    const sesionEsperada: DatosAutenticacion = {
      ...datosSesion,
      user: usuarioActualizado,
    };

    expect(respuestaRecibida).toEqual(respuesta);
    expect(servicio.usuarioActual()).toEqual(usuarioActualizado);
    expect(servicio.sesionActual()).toEqual(sesionEsperada);
    expect(almacenamientoSesion.obtenerSesion()).toEqual(sesionEsperada);
  });

  it('cierra sesion y limpia la sesion local cuando la respuesta es correcta', () => {
    const datosSesion = crearDatosSesion('logout');
    const { almacenamientoSesion } = configurarPrueba();

    almacenamientoSesion.guardarSesion(datosSesion);
    const servicio = TestBed.inject(AutenticacionService);

    const respuesta: RespuestaCierreSesion = {
      success: true,
      message: 'Sesion cerrada correctamente.',
    };
    let respuestaRecibida: RespuestaCierreSesion | undefined;

    servicio.cerrarSesion().subscribe((valor) => {
      respuestaRecibida = valor;
    });

    const solicitud = controladorHttp!.expectOne(obtenerUrlApi('auth/logout'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({});

    solicitud.flush(respuesta);

    expect(respuestaRecibida).toEqual(respuesta);
    expect(almacenamientoSesion.obtenerSesion()).toBeNull();
    expect(servicio.sesionActual()).toBeNull();
    expect(servicio.estaAutenticado()).toBe(false);
  });

  it('limpia la sesion local cuando el cierre de sesion devuelve error', () => {
    const datosSesion = crearDatosSesion('logout-error');
    const { almacenamientoSesion } = configurarPrueba();

    almacenamientoSesion.guardarSesion(datosSesion);
    const servicio = TestBed.inject(AutenticacionService);

    let errorRecibido: unknown;

    servicio.cerrarSesion().subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    const solicitud = controladorHttp!.expectOne(obtenerUrlApi('auth/logout'));

    solicitud.flush(
      { success: false, message: 'Error de cierre.' },
      { status: 500, statusText: 'Error del servidor' },
    );

    expect(errorRecibido).toBeTruthy();
    expect(almacenamientoSesion.obtenerSesion()).toBeNull();
    expect(servicio.sesionActual()).toBeNull();
    expect(servicio.estaAutenticado()).toBe(false);
  });

  it('limpiarSesion elimina el almacenamiento y reinicia las senales', () => {
    const datosSesion = crearDatosSesion('limpieza');
    const { almacenamientoSesion } = configurarPrueba();

    almacenamientoSesion.guardarSesion(datosSesion);
    const servicio = TestBed.inject(AutenticacionService);

    servicio.limpiarSesion();

    expect(almacenamientoSesion.obtenerSesion()).toBeNull();
    expect(servicio.sesionActual()).toBeNull();
    expect(servicio.usuarioActual()).toBeNull();
    expect(servicio.estaAutenticado()).toBe(false);
  });
});
