import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import type {
  RespuestaRenovacionSesion,
  UsuarioAutenticado,
} from '../models/autenticacion.model';
import { AutenticacionService } from '../services/autenticacion.service';
import { guardAutenticacion } from './autenticacion.guard';

interface AutenticacionServiceMock {
  estaAutenticado: Signal<boolean>;
  usuarioActual: Signal<UsuarioAutenticado | null>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
  renovarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaRenovacionSesion>>>;
}

describe('guardAutenticacion', () => {
  let estadoAutenticacion: ReturnType<typeof signal<boolean>>;
  let autenticacionService: AutenticacionServiceMock;

  beforeEach(() => {
    estadoAutenticacion = signal(false);
    autenticacionService = {
      estaAutenticado: estadoAutenticacion.asReadonly(),
      usuarioActual: signal<UsuarioAutenticado | null>(null).asReadonly(),
      limpiarSesion: vi.fn(),
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
  });

  it('devuelve true cuando estaAutenticado es true', () => {
    estadoAutenticacion.set(true);

    expect(ejecutarGuard()).toBe(true);
  });

  it('devuelve false cuando estaAutenticado es false', () => {
    estadoAutenticacion.set(false);

    expect(ejecutarGuard()).toBe(false);
  });

  it('consulta el estado actual en cada ejecucion y no guarda un valor obsoleto', () => {
    estadoAutenticacion.set(false);
    expect(ejecutarGuard()).toBe(false);

    estadoAutenticacion.set(true);
    expect(ejecutarGuard()).toBe(true);
  });

  it('no llama a limpiarSesion', () => {
    ejecutarGuard();

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('no llama a renovarSesion', () => {
    ejecutarGuard();

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('no realiza efectos secundarios', () => {
    estadoAutenticacion.set(true);

    ejecutarGuard();

    expect(estadoAutenticacion()).toBe(true);
    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('puede ejecutarse varias veces', () => {
    estadoAutenticacion.set(true);

    expect(ejecutarGuard()).toBe(true);
    expect(ejecutarGuard()).toBe(true);
    expect(ejecutarGuard()).toBe(true);
  });
});

function ejecutarGuard(): boolean {
  const resultado = TestBed.runInInjectionContext(() =>
    guardAutenticacion(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot),
  );

  if (typeof resultado !== 'boolean') {
    throw new Error('El guard debe devolver un valor booleano.');
  }

  return resultado;
}
