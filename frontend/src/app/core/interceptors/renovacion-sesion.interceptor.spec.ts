import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { obtenerUrlApi } from '../config/configuracion-api';
import type { RespuestaRenovacionSesion } from '../models/autenticacion.model';
import { AutenticacionService } from '../services/autenticacion.service';
import { interceptorRenovacionSesion } from './renovacion-sesion.interceptor';

interface AutenticacionServiceMock {
  renovarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaRenovacionSesion>>>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
  obtenerTokenAcceso: ReturnType<typeof vi.fn<() => string | null>>;
  obtenerTokenRenovacion: ReturnType<typeof vi.fn<() => string | null>>;
}

function crearRespuestaRenovacion(): RespuestaRenovacionSesion {
  return {
    success: true,
    data: {
      user: {
        id: 1,
        nombres: 'Persona',
        apellidos: 'Prueba',
        correo: 'persona.prueba@universidad.edu',
        estado: 'ACTIVO',
        debe_cambiar_password: false,
        estudiante_id: null,
        docente_id: null,
        rol: null,
      },
      tokens: {
        accessToken: 'token-acceso-nuevo',
        refreshToken: 'token-renovacion-nuevo',
        accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
        refreshTokenExpiresAt: '2026-08-03T11:00:00.000Z',
      },
    },
  };
}

describe('interceptorRenovacionSesion', () => {
  let http: HttpClient;
  let controladorHttp: HttpTestingController;
  let autenticacionService: AutenticacionServiceMock;
  let renovacion: Subject<RespuestaRenovacionSesion>;

  beforeEach(() => {
    renovacion = new Subject<RespuestaRenovacionSesion>();
    autenticacionService = {
      renovarSesion: vi.fn(() => renovacion.asObservable()),
      limpiarSesion: vi.fn(),
      obtenerTokenAcceso: vi.fn(() => 'token-acceso-nuevo'),
      obtenerTokenRenovacion: vi.fn(() => 'token-renovacion-anterior'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([interceptorRenovacionSesion])),
        provideHttpClientTesting(),
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('una respuesta correcta no activa renovacion', () => {
    let respuestaRecibida: unknown;

    http.get(obtenerUrlApi('datos')).subscribe((respuesta) => {
      respuestaRecibida = respuesta;
    });

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));
    solicitud.flush({ success: true });

    expect(respuestaRecibida).toEqual({ success: true });
    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('un error distinto de 401 no activa renovacion', () => {
    let errorRecibido: unknown;

    http.get(obtenerUrlApi('datos')).subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));
    solicitud.flush({}, { status: 403, statusText: 'Prohibido' });

    expect(errorRecibido).toBeTruthy();
    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('un 401 de una URL externa no activa renovacion', () => {
    http.get('https://otra-api.com/datos').subscribe({ error: () => undefined });

    const solicitud = controladorHttp.expectOne('https://otra-api.com/datos');
    solicitud.flush({}, { status: 401, statusText: 'No autorizado' });

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('un 401 de login no activa renovacion', () => {
    http.post(obtenerUrlApi('auth/login'), {}).subscribe({ error: () => undefined });

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('auth/login'));
    solicitud.flush({}, { status: 401, statusText: 'No autorizado' });

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('un 401 de refresh no activa otra renovacion', () => {
    http.post(obtenerUrlApi('auth/refresh'), {}).subscribe({ error: () => undefined });

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('auth/refresh'));
    solicitud.flush({}, { status: 401, statusText: 'No autorizado' });

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('un 401 sin refresh token limpia la sesion y no renueva', () => {
    autenticacionService.obtenerTokenRenovacion.mockReturnValue(null);

    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));
    solicitud.flush({}, { status: 401, statusText: 'No autorizado' });

    expect(autenticacionService.limpiarSesion).toHaveBeenCalledTimes(1);
    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('un 401 con refresh token activa una renovacion', () => {
    http.get(obtenerUrlApi('datos')).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));
    solicitud.flush({}, { status: 401, statusText: 'No autorizado' });

    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(1);

    renovacion.next(crearRespuestaRenovacion());
    renovacion.complete();

    const solicitudReintentada = controladorHttp.expectOne(obtenerUrlApi('datos'));
    solicitudReintentada.flush({ success: true });
  });

  it('despues de renovar reintenta la solicitud original con el access token nuevo', () => {
    let respuestaRecibida: unknown;

    http.get(obtenerUrlApi('datos')).subscribe((respuesta) => {
      respuestaRecibida = respuesta;
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    renovacion.next(crearRespuestaRenovacion());
    renovacion.complete();

    const solicitudReintentada = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitudReintentada.request.headers.get('Authorization')).toBe(
      'Bearer token-acceso-nuevo',
    );

    solicitudReintentada.flush({ success: true, data: 'ok' });

    expect(respuestaRecibida).toEqual({ success: true, data: 'ok' });
  });

  it('conserva metodo URL parametros y cuerpo de la solicitud original', () => {
    const cuerpo = { nombre: 'Dato de prueba' };

    http
      .post(obtenerUrlApi('datos'), cuerpo, {
        params: {
          pagina: '1',
        },
      })
      .subscribe();

    controladorHttp
      .expectOne(`${obtenerUrlApi('datos')}?pagina=1`)
      .flush({}, { status: 401, statusText: 'No autorizado' });

    renovacion.next(crearRespuestaRenovacion());
    renovacion.complete();

    const solicitudReintentada = controladorHttp.expectOne(
      `${obtenerUrlApi('datos')}?pagina=1`,
    );

    expect(solicitudReintentada.request.method).toBe('POST');
    expect(solicitudReintentada.request.urlWithParams).toBe(
      `${obtenerUrlApi('datos')}?pagina=1`,
    );
    expect(solicitudReintentada.request.body).toEqual(cuerpo);

    solicitudReintentada.flush({});
  });

  it('si el reintento devuelve 401 no crea un ciclo y limpia la sesion', () => {
    let errorRecibido: unknown;

    http.get(obtenerUrlApi('datos')).subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    renovacion.next(crearRespuestaRenovacion());
    renovacion.complete();

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    expect(errorRecibido).toBeTruthy();
    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(1);
    expect(autenticacionService.limpiarSesion).toHaveBeenCalledTimes(1);
  });

  it('si falla la renovacion limpia la sesion y no reintenta la solicitud original', () => {
    let errorRecibido: unknown;

    http.get(obtenerUrlApi('datos')).subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    renovacion.error(new Error('Fallo de renovacion.'));

    controladorHttp.expectNone(obtenerUrlApi('datos'));
    expect(errorRecibido).toBeTruthy();
    expect(autenticacionService.limpiarSesion).toHaveBeenCalledTimes(1);
  });

  it('dos solicitudes simultaneas generan una sola renovacion y ambas se reintentan', () => {
    const respuestas: unknown[] = [];

    http.get(obtenerUrlApi('datos/uno')).subscribe((respuesta) => {
      respuestas.push(respuesta);
    });
    http.get(obtenerUrlApi('datos/dos')).subscribe((respuesta) => {
      respuestas.push(respuesta);
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos/uno'))
      .flush({}, { status: 401, statusText: 'No autorizado' });
    controladorHttp
      .expectOne(obtenerUrlApi('datos/dos'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(1);

    renovacion.next(crearRespuestaRenovacion());
    renovacion.complete();

    controladorHttp.expectOne(obtenerUrlApi('datos/uno')).flush({ dato: 1 });
    controladorHttp.expectOne(obtenerUrlApi('datos/dos')).flush({ dato: 2 });

    expect(respuestas).toEqual([{ dato: 1 }, { dato: 2 }]);
  });

  it('el error final llega al consumidor', () => {
    let errorRecibido: unknown;

    http.get(obtenerUrlApi('datos')).subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    renovacion.error(new Error('Error final.'));

    expect(errorRecibido).toBeTruthy();
  });
});
