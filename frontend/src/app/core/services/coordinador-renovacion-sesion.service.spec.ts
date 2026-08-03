import { TestBed } from '@angular/core/testing';
import { defer, Observable, Subject, throwError } from 'rxjs';

import type {
  DatosAutenticacion,
  RespuestaRenovacionSesion,
} from '../models/autenticacion.model';
import { AutenticacionService } from './autenticacion.service';
import { CoordinadorRenovacionSesionService } from './coordinador-renovacion-sesion.service';

interface AutenticacionServiceMock {
  renovarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaRenovacionSesion>>>;
}

function crearDatosSesion(sufijo = 'renovada'): DatosAutenticacion {
  return {
    user: {
      id: 1,
      nombres: `Persona ${sufijo}`,
      apellidos: 'Prueba',
      correo: `persona.${sufijo}@universidad.edu`,
      estado: 'ACTIVO',
      debe_cambiar_password: false,
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

function crearRespuesta(sufijo = 'renovada'): RespuestaRenovacionSesion {
  return {
    success: true,
    data: crearDatosSesion(sufijo),
  };
}

describe('CoordinadorRenovacionSesionService', () => {
  let servicio: CoordinadorRenovacionSesionService;
  let autenticacionService: AutenticacionServiceMock;

  beforeEach(() => {
    autenticacionService = {
      renovarSesion: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    });

    servicio = TestBed.inject(CoordinadorRenovacionSesionService);
  });

  it('crea el servicio', () => {
    expect(servicio).toBeTruthy();
  });

  it('una llamada ejecuta una renovacion', () => {
    const respuesta = crearRespuesta();
    autenticacionService.renovarSesion.mockReturnValue(defer(() => [respuesta]));

    servicio.renovarSesionCompartida().subscribe();

    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(1);
  });

  it('dos suscripciones simultaneas comparten una sola renovacion', () => {
    const renovacion = new Subject<RespuestaRenovacionSesion>();
    const respuestas: RespuestaRenovacionSesion[] = [];

    autenticacionService.renovarSesion.mockReturnValue(renovacion.asObservable());

    servicio.renovarSesionCompartida().subscribe((respuesta) => {
      respuestas.push(respuesta);
    });
    servicio.renovarSesionCompartida().subscribe((respuesta) => {
      respuestas.push(respuesta);
    });

    const respuesta = crearRespuesta();
    renovacion.next(respuesta);
    renovacion.complete();

    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(1);
    expect(respuestas).toEqual([respuesta, respuesta]);
  });

  it('ambas suscripciones reciben la misma respuesta', () => {
    const renovacion = new Subject<RespuestaRenovacionSesion>();
    const respuestas: RespuestaRenovacionSesion[] = [];
    const respuesta = crearRespuesta('compartida');

    autenticacionService.renovarSesion.mockReturnValue(renovacion.asObservable());

    servicio.renovarSesionCompartida().subscribe((valor) => {
      respuestas.push(valor);
    });
    servicio.renovarSesionCompartida().subscribe((valor) => {
      respuestas.push(valor);
    });

    renovacion.next(respuesta);
    renovacion.complete();

    expect(respuestas[0]).toBe(respuesta);
    expect(respuestas[1]).toBe(respuesta);
  });

  it('despues de completarse puede iniciarse una renovacion nueva', () => {
    autenticacionService.renovarSesion
      .mockReturnValueOnce(defer(() => [crearRespuesta('primera')]))
      .mockReturnValueOnce(defer(() => [crearRespuesta('segunda')]));

    servicio.renovarSesionCompartida().subscribe();
    servicio.renovarSesionCompartida().subscribe();

    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(2);
  });

  it('despues de un error puede iniciarse una renovacion nueva', () => {
    autenticacionService.renovarSesion
      .mockReturnValueOnce(throwError(() => new Error('Error de renovacion.')))
      .mockReturnValueOnce(defer(() => [crearRespuesta('posterior')]));

    servicio.renovarSesionCompartida().subscribe({ error: () => undefined });
    servicio.renovarSesionCompartida().subscribe();

    expect(autenticacionService.renovarSesion).toHaveBeenCalledTimes(2);
  });

  it('el error se propaga a todos los suscriptores', () => {
    const renovacion = new Subject<RespuestaRenovacionSesion>();
    const errores: unknown[] = [];
    const errorRenovacion = new Error('Error compartido.');

    autenticacionService.renovarSesion.mockReturnValue(renovacion.asObservable());

    servicio.renovarSesionCompartida().subscribe({
      error: (error: unknown) => errores.push(error),
    });
    servicio.renovarSesionCompartida().subscribe({
      error: (error: unknown) => errores.push(error),
    });

    renovacion.error(errorRenovacion);

    expect(errores).toEqual([errorRenovacion, errorRenovacion]);
  });

  it('no realiza subscribe internamente', () => {
    let cantidadSuscripciones = 0;

    autenticacionService.renovarSesion.mockReturnValue(
      new Observable<RespuestaRenovacionSesion>((suscriptor) => {
        cantidadSuscripciones += 1;
        suscriptor.next(crearRespuesta());
        suscriptor.complete();
      }),
    );

    servicio.renovarSesionCompartida();

    expect(cantidadSuscripciones).toBe(0);
  });
});
