import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { obtenerUrlApi } from '../config/configuracion-api';
import { AutenticacionService } from '../services/autenticacion.service';
import { interceptorTokenAcceso } from './token-acceso.interceptor';

interface AutenticacionServiceMock {
  obtenerTokenAcceso: ReturnType<typeof vi.fn<() => string | null>>;
}

describe('interceptorTokenAcceso', () => {
  let http: HttpClient;
  let controladorHttp: HttpTestingController;
  let autenticacionService: AutenticacionServiceMock;

  beforeEach(() => {
    autenticacionService = {
      obtenerTokenAcceso: vi.fn(() => 'token-acceso-prueba'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([interceptorTokenAcceso])),
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

  it('agrega Authorization a una solicitud de la API cuando existe token', () => {
    http.get(obtenerUrlApi('auth/me')).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('auth/me'));

    expect(solicitud.request.headers.get('Authorization')).toBe(
      'Bearer token-acceso-prueba',
    );

    solicitud.flush({});
  });

  it('usa exactamente Bearer token', () => {
    http.get(obtenerUrlApi('datos')).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitud.request.headers.get('Authorization')).toBe(
      'Bearer token-acceso-prueba',
    );

    solicitud.flush({});
  });

  it('no agrega encabezado cuando no existe token', () => {
    autenticacionService.obtenerTokenAcceso.mockReturnValue(null);

    http.get(obtenerUrlApi('datos')).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);

    solicitud.flush({});
  });

  it('no modifica solicitudes externas', () => {
    http.get('https://otra-api.com/datos').subscribe();

    const solicitud = controladorHttp.expectOne('https://otra-api.com/datos');

    expect(solicitud.request.headers.has('Authorization')).toBe(false);

    solicitud.flush({});
  });

  it('no agrega token a auth/login', () => {
    http.post(obtenerUrlApi('auth/login'), {}).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('auth/login'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);

    solicitud.flush({});
  });

  it('no agrega token a auth/refresh', () => {
    http.post(obtenerUrlApi('auth/refresh'), {}).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('auth/refresh'));

    expect(solicitud.request.headers.has('Authorization')).toBe(false);

    solicitud.flush({});
  });

  it('conserva un encabezado Authorization agregado explicitamente', () => {
    http
      .get(obtenerUrlApi('datos'), {
        headers: {
          Authorization: 'Bearer token-explicito',
        },
      })
      .subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitud.request.headers.get('Authorization')).toBe(
      'Bearer token-explicito',
    );

    solicitud.flush({});
  });

  it('no modifica el cuerpo ni el metodo de la solicitud', () => {
    const cuerpo = { nombre: 'Dato de prueba' };

    http.post(obtenerUrlApi('datos'), cuerpo).subscribe();

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('datos'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(cuerpo);

    solicitud.flush({});
  });
});
