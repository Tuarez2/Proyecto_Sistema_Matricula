import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { obtenerUrlApi } from '../config/configuracion-api';
import { AutenticacionService } from '../services/autenticacion.service';
import { ManejadorErroresHttpService } from '../services/manejador-errores-http.service';
import { interceptorErroresHttp } from './errores-http.interceptor';

describe('interceptorErroresHttp', () => {
  let http: HttpClient;
  let controladorHttp: HttpTestingController;
  let manejadorErroresHttp: ManejadorErroresHttpService;
  let limpiarSesion: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    limpiarSesion = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([interceptorErroresHttp])),
        provideHttpClientTesting(),
        {
          provide: AutenticacionService,
          useValue: {
            limpiarSesion,
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    controladorHttp = TestBed.inject(HttpTestingController);
    manejadorErroresHttp = TestBed.inject(ManejadorErroresHttpService);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('un 401 definitivo registra SESION_NO_AUTORIZADA', () => {
    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    controladorHttp.expectOne(obtenerUrlApi('datos')).flush(
      {
        success: false,
        message: 'Token invalido o expirado.',
        code: 'INVALID_TOKEN',
      },
      { status: 401, statusText: 'No autorizado' },
    );

    expect(manejadorErroresHttp.ultimoError()?.tipo).toBe('SESION_NO_AUTORIZADA');
  });

  it('un 401 de login no se registra globalmente', () => {
    http.post(obtenerUrlApi('auth/login'), {}).subscribe({ error: () => undefined });

    controladorHttp
      .expectOne(obtenerUrlApi('auth/login'))
      .flush({}, { status: 401, statusText: 'No autorizado' });

    expect(manejadorErroresHttp.ultimoError()).toBeNull();
  });

  it('un 403 registra ACCESO_PROHIBIDO y no limpia la sesion', () => {
    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    controladorHttp.expectOne(obtenerUrlApi('datos')).flush(
      {
        success: false,
        message: 'No tiene permisos para realizar esta accion.',
        code: 'FORBIDDEN',
      },
      { status: 403, statusText: 'Prohibido' },
    );

    expect(manejadorErroresHttp.ultimoError()?.tipo).toBe('ACCESO_PROHIBIDO');
    expect(limpiarSesion).not.toHaveBeenCalled();
  });

  it('un 429 registra DEMASIADAS_SOLICITUDES y lee Retry-After valido', () => {
    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    controladorHttp.expectOne(obtenerUrlApi('datos')).flush(
      {
        success: false,
        message: 'Demasiadas solicitudes. Intente nuevamente mas tarde.',
        code: 'TOO_MANY_REQUESTS',
      },
      {
        status: 429,
        statusText: 'Demasiadas solicitudes',
        headers: {
          'Retry-After': '30',
        },
      },
    );

    expect(manejadorErroresHttp.ultimoError()?.tipo).toBe(
      'DEMASIADAS_SOLICITUDES',
    );
    expect(manejadorErroresHttp.ultimoError()?.reintentarDespuesSegundos).toBe(30);
  });

  it('un Retry-After invalido produce null', () => {
    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    controladorHttp.expectOne(obtenerUrlApi('datos')).flush(
      {},
      {
        status: 429,
        statusText: 'Demasiadas solicitudes',
        headers: {
          'Retry-After': 'texto',
        },
      },
    );

    expect(manejadorErroresHttp.ultimoError()?.reintentarDespuesSegundos).toBeNull();
  });

  it('conserva message code y details validos del backend', () => {
    const detalles = { campo: 'permiso' };

    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    controladorHttp.expectOne(obtenerUrlApi('datos')).flush(
      {
        success: false,
        message: 'Mensaje del backend.',
        code: 'CODIGO_BACKEND',
        details: detalles,
      },
      { status: 403, statusText: 'Prohibido' },
    );

    expect(manejadorErroresHttp.ultimoError()?.mensaje).toBe('Mensaje del backend.');
    expect(manejadorErroresHttp.ultimoError()?.codigo).toBe('CODIGO_BACKEND');
    expect(manejadorErroresHttp.ultimoError()?.detalles).toEqual(detalles);
  });

  it('utiliza mensajes predeterminados ante un cuerpo invalido', () => {
    http.get(obtenerUrlApi('datos')).subscribe({ error: () => undefined });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush('error', { status: 401, statusText: 'No autorizado' });

    expect(manejadorErroresHttp.ultimoError()?.mensaje).toBe(
      'La sesión no es válida o ha expirado.',
    );
    expect(manejadorErroresHttp.ultimoError()?.codigo).toBeNull();
  });

  it('no registra errores de solicitudes externas', () => {
    http.get('https://otra-api.com/datos').subscribe({ error: () => undefined });

    controladorHttp
      .expectOne('https://otra-api.com/datos')
      .flush({}, { status: 403, statusText: 'Prohibido' });

    expect(manejadorErroresHttp.ultimoError()).toBeNull();
  });

  it('no registra otros estados como 400 404 o 500', () => {
    for (const estado of [400, 404, 500]) {
      http.get(obtenerUrlApi(`datos/${estado}`)).subscribe({ error: () => undefined });
      controladorHttp
        .expectOne(obtenerUrlApi(`datos/${estado}`))
        .flush({}, { status: estado, statusText: 'Error' });
    }

    expect(manejadorErroresHttp.ultimoError()).toBeNull();
  });

  it('todos los errores continuan llegando al consumidor', () => {
    let errorRecibido: unknown;

    http.get(obtenerUrlApi('datos')).subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 403, statusText: 'Prohibido' });

    expect(errorRecibido).toBeTruthy();
  });

  it('no convierte errores en respuestas exitosas', () => {
    let respuestaRecibida: unknown;
    let errorRecibido: unknown;

    http.get(obtenerUrlApi('datos')).subscribe({
      next: (respuesta: unknown) => {
        respuestaRecibida = respuesta;
      },
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    controladorHttp
      .expectOne(obtenerUrlApi('datos'))
      .flush({}, { status: 429, statusText: 'Demasiadas solicitudes' });

    expect(respuestaRecibida).toBeUndefined();
    expect(errorRecibido).toBeTruthy();
  });
});
