import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable } from 'rxjs';

import { routes } from '../../app.routes';
import type {
  CredencialesInicioSesion,
  RespuestaInicioSesion,
} from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { InicioSesionComponent } from './inicio-sesion/inicio-sesion.component';
import { rutasAutenticacion } from './autenticacion.routes';

interface AutenticacionServiceMock {
  iniciarSesion: ReturnType<
    typeof vi.fn<(credenciales: CredencialesInicioSesion) => Observable<RespuestaInicioSesion>>
  >;
}

describe('rutasAutenticacion', () => {
  it('existe una ruta con path iniciar-sesion', () => {
    expect(obtenerRutaInicioSesion()).toBeTruthy();
  });

  it('la ruta utiliza carga diferida mediante loadComponent', () => {
    expect(obtenerRutaInicioSesion().loadComponent).toBeTruthy();
  });

  it('el titulo es Iniciar sesión', () => {
    expect(obtenerRutaInicioSesion().title).toBe('Iniciar sesión');
  });

  it('la carga diferida devuelve InicioSesionComponent', async () => {
    const componente = await obtenerRutaInicioSesion().loadComponent?.();

    expect(componente).toBe(InicioSesionComponent);
  });

  it('la ruta no tiene guard de autenticacion', () => {
    expect(obtenerRutaInicioSesion().canActivate).toBeUndefined();
  });

  it('la ruta no tiene datos de roles', () => {
    expect(obtenerRutaInicioSesion().data).toBeUndefined();
  });

  it('la ruta iniciar-sesion puede activarse con la configuracion real', async () => {
    const autenticacionService: AutenticacionServiceMock = {
      iniciarSesion: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    });

    const harness = await RouterTestingHarness.create('/iniciar-sesion');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Iniciar sesión',
    );
  });
});

function obtenerRutaInicioSesion(): Route {
  const ruta = rutasAutenticacion.find((rutaActual) => rutaActual.path === 'iniciar-sesion');

  if (!ruta) {
    throw new Error('No existe la ruta iniciar-sesion.');
  }

  return ruta;
}
