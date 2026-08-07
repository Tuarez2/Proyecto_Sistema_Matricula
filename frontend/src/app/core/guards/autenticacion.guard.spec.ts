import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
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

interface RouterNavegacion {
  navigate: ReturnType<typeof vi.fn>;
  navigateByUrl: ReturnType<typeof vi.fn>;
}

describe('guardAutenticacion', () => {
  let estadoAutenticacion: ReturnType<typeof signal<boolean>>;
  let autenticacionService: AutenticacionServiceMock;
  let router: Router;
  let routerNavegacion: RouterNavegacion;

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
        provideRouter([]),
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    });

    router = TestBed.inject(Router);
    routerNavegacion = {
      navigate: vi.spyOn(router, 'navigate'),
      navigateByUrl: vi.spyOn(router, 'navigateByUrl'),
    };
  });

  it('devuelve true cuando el usuario esta autenticado', () => {
    estadoAutenticacion.set(true);

    expect(ejecutarGuard('/')).toBe(true);
  });

  it('devuelve un UrlTree cuando no esta autenticado', () => {
    estadoAutenticacion.set(false);

    expect(ejecutarGuard('/')).toBeInstanceOf(UrlTree);
  });

  it('el UrlTree apunta a iniciar-sesion', () => {
    const resultado = ejecutarGuard('/');

    expect(serializarResultado(resultado)).toContain('/iniciar-sesion');
  });

  it('conserva / como parametro retorno', () => {
    const resultado = ejecutarGuard('/');

    expect(serializarResultado(resultado)).toBe('/iniciar-sesion?retorno=%2F');
  });

  it('conserva /usuarios como parametro retorno', () => {
    const resultado = ejecutarGuard('/usuarios');

    expect(serializarResultado(resultado)).toBe(
      '/iniciar-sesion?retorno=%2Fusuarios',
    );
  });

  it('conserva query params en la URL de retorno original', () => {
    const resultado = ejecutarGuard('/usuarios?pagina=2');

    expect(serializarResultado(resultado)).toBe(
      '/iniciar-sesion?retorno=%2Fusuarios%3Fpagina%3D2',
    );
  });

  it('consulta el estado actual en cada ejecucion', () => {
    estadoAutenticacion.set(false);
    expect(ejecutarGuard('/')).toBeInstanceOf(UrlTree);

    estadoAutenticacion.set(true);
    expect(ejecutarGuard('/')).toBe(true);
  });

  it('no ejecuta navigate', () => {
    ejecutarGuard('/');

    expect(routerNavegacion.navigate).not.toHaveBeenCalled();
  });

  it('no ejecuta navigateByUrl', () => {
    ejecutarGuard('/');

    expect(routerNavegacion.navigateByUrl).not.toHaveBeenCalled();
  });

  it('no limpia la sesion', () => {
    ejecutarGuard('/');

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('no renueva la sesion', () => {
    ejecutarGuard('/');

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('puede ejecutarse varias veces', () => {
    estadoAutenticacion.set(false);

    expect(ejecutarGuard('/')).toBeInstanceOf(UrlTree);
    expect(ejecutarGuard('/usuarios')).toBeInstanceOf(UrlTree);
    expect(ejecutarGuard('/periodos-academicos')).toBeInstanceOf(UrlTree);
  });

  function ejecutarGuard(url: string): boolean | UrlTree {
    const estado = { url } as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() =>
      guardAutenticacion(new ActivatedRouteSnapshot(), estado),
    ) as boolean | UrlTree;
  }

  function serializarResultado(resultado: boolean | UrlTree): string {
    if (typeof resultado === 'boolean') {
      throw new Error('Se esperaba un UrlTree.');
    }

    return router.serializeUrl(resultado);
  }
});
