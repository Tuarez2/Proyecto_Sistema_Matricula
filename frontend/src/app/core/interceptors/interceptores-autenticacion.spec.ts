import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { obtenerUrlApi } from '../config/configuracion-api';
import type {
  DatosAutenticacion,
  RespuestaRenovacionSesion,
} from '../models/autenticacion.model';
import { AlmacenamientoSesionService } from '../services/almacenamiento-sesion.service';
import { AutenticacionService } from '../services/autenticacion.service';
import { ManejadorErroresHttpService } from '../services/manejador-errores-http.service';
import { interceptorErroresHttp } from './errores-http.interceptor';
import { interceptorRenovacionSesion } from './renovacion-sesion.interceptor';
import { interceptorTokenAcceso } from './token-acceso.interceptor';

function crearDatosSesion(sufijo: string): DatosAutenticacion {
  return {
    user: {
      id: 1,
      nombres: `Persona ${sufijo}`,
      apellidos: 'Prueba',
      correo: `persona.${sufijo}@universidad.edu`,
      estado: 'ACTIVO',
      debe_cambiar_password: false,
      estudiante_id: null,
      docente_id: null,
      rol: null,
    },
    tokens: {
      accessToken: `token-acceso-${sufijo}`,
      refreshToken: `token-renovacion-${sufijo}`,
      accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
      refreshTokenExpiresAt: '2026-08-03T11:00:00.000Z',
    },
  };
}

describe('interceptores de autenticacion integrados', () => {
  let http: HttpClient;
  let controladorHttp: HttpTestingController;
  let almacenamientoSesion: AlmacenamientoSesionService;
  let manejadorErroresHttp: ManejadorErroresHttpService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            interceptorTokenAcceso,
            interceptorErroresHttp,
            interceptorRenovacionSesion,
          ]),
        ),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controladorHttp = TestBed.inject(HttpTestingController);
    almacenamientoSesion = TestBed.inject(AlmacenamientoSesionService);
    manejadorErroresHttp = TestBed.inject(ManejadorErroresHttpService);
  });

  afterEach(() => {
    controladorHttp.verify();
    sessionStorage.clear();
  });

  it('renueva la sesion y reintenta sin registrar el 401 intermedio', () => {
    const sesionAnterior = crearDatosSesion('anterior');
    const sesionNueva = crearDatosSesion('nuevo');
    const respuestaRenovacion: RespuestaRenovacionSesion = {
      success: true,
      data: sesionNueva,
    };
    let respuestaRecibida: unknown;

    almacenamientoSesion.guardarSesion(sesionAnterior);
    TestBed.inject(AutenticacionService);

    http.get(obtenerUrlApi('datos')).subscribe((respuesta) => {
      respuestaRecibida = respuesta;
    });

    const solicitudInicial = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitudInicial.request.headers.get('Authorization')).toBe(
      'Bearer token-acceso-anterior',
    );

    solicitudInicial.flush(
      {
        success: false,
        message: 'Token invalido o expirado.',
        code: 'INVALID_TOKEN',
      },
      { status: 401, statusText: 'No autorizado' },
    );

    const solicitudRenovacion = controladorHttp.expectOne(obtenerUrlApi('auth/refresh'));

    expect(solicitudRenovacion.request.method).toBe('POST');
    expect(solicitudRenovacion.request.headers.has('Authorization')).toBe(false);
    expect(solicitudRenovacion.request.body).toEqual({
      refreshToken: sesionAnterior.tokens.refreshToken,
    });

    solicitudRenovacion.flush(respuestaRenovacion);

    const solicitudReintentada = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitudReintentada.request.headers.get('Authorization')).toBe(
      'Bearer token-acceso-nuevo',
    );
    expect(manejadorErroresHttp.ultimoError()).toBeNull();

    solicitudReintentada.flush({ success: true, data: { valor: 'ok' } });

    expect(respuestaRecibida).toEqual({ success: true, data: { valor: 'ok' } });
  });
});
