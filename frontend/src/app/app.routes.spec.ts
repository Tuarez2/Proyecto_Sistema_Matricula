import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable } from 'rxjs';

import { guardAutenticacion } from './core/guards/autenticacion.guard';
import { guardRoles } from './core/guards/roles.guard';
import type {
  CredencialesInicioSesion,
  RespuestaInicioSesion,
  UsuarioAutenticado,
} from './core/models/autenticacion.model';
import { AutenticacionService } from './core/services/autenticacion.service';
import { routes } from './app.routes';

interface AutenticacionServiceMock {
  estaAutenticado: Signal<boolean>;
  usuarioActual: Signal<UsuarioAutenticado | null>;
  iniciarSesion: ReturnType<
    typeof vi.fn<(credenciales: CredencialesInicioSesion) => Observable<RespuestaInicioSesion>>
  >;
}

describe('routes', () => {
  let estadoAutenticacion: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    estadoAutenticacion = signal(false);
  });

  it('la ruta del layout principal contiene guardAutenticacion', () => {
    expect(obtenerRutaLayout().canActivate).toContain(guardAutenticacion);
  });

  it('la ruta de autenticacion continua antes del layout', () => {
    expect(routes.indexOf(obtenerRutaAutenticacion())).toBeLessThan(
      routes.indexOf(obtenerRutaLayout()),
    );
  });

  it('un usuario no autenticado que navega a raiz termina en iniciar-sesion', async () => {
    const harness = await crearHarness(false, '/');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Iniciar sesión',
    );
  });

  it('la URL incluye el parametro de retorno raiz', async () => {
    await crearHarness(false, '/');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/iniciar-sesion?retorno=%2F');
  });

  it('un usuario autenticado puede navegar a raiz', async () => {
    const harness = await crearHarness(true, '/');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('un usuario autenticado que navega a iniciar-sesion es redirigido a raiz', async () => {
    const harness = await crearHarness(true, '/iniciar-sesion');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('la ruta comodin sigue existiendo', () => {
    expect(routes.some((ruta) => ruta.path === '**')).toBe(true);
  });

  it('no se agrego guardRoles al layout', () => {
    expect(obtenerRutaLayout().canActivate).not.toContain(guardRoles);
  });

  it('no se agregaron datos de roles al layout', () => {
    expect(obtenerRutaLayout().data).toBeUndefined();
  });

  it('no se crearon ciclos de redireccion', async () => {
    await crearHarness(false, '/');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/iniciar-sesion?retorno=%2F');
  });

  async function crearHarness(
    estaAutenticado: boolean,
    urlInicial: string,
  ): Promise<RouterTestingHarness> {
    const autenticacionService: AutenticacionServiceMock = {
      estaAutenticado: estadoAutenticacion.asReadonly(),
      usuarioActual: signal<UsuarioAutenticado | null>(null).asReadonly(),
      iniciarSesion: vi.fn(),
    };

    estadoAutenticacion.set(estaAutenticado);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    });

    return RouterTestingHarness.create(urlInicial);
  }

  function obtenerRutaAutenticacion() {
    const ruta = routes.find((rutaActual) => rutaActual.loadChildren);

    if (!ruta) {
      throw new Error('No existe ruta de autenticacion.');
    }

    return ruta;
  }

  function obtenerRutaLayout() {
    const ruta = routes.find((rutaActual) => rutaActual.loadComponent);

    if (!ruta) {
      throw new Error('No existe ruta de layout.');
    }

    return ruta;
  }
});
