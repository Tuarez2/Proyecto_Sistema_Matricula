import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable } from 'rxjs';

import { routes } from '../../app.routes';
import { guardAutenticacion } from '../../core/guards/autenticacion.guard';
import { guardInvitado } from '../../core/guards/invitado.guard';
import { guardRoles } from '../../core/guards/roles.guard';
import type {
  CredencialesInicioSesion,
  RespuestaInicioSesion,
  UsuarioAutenticado,
} from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { InicioSesionComponent } from './inicio-sesion/inicio-sesion.component';
import { rutasAutenticacion } from './autenticacion.routes';

interface AutenticacionServiceMock {
  estaAutenticado: ReturnType<typeof vi.fn<() => boolean>>;
  usuarioActual: Signal<UsuarioAutenticado | null>;
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

  it('tiene exactamente guardInvitado', () => {
    expect(obtenerRutaInicioSesion().canActivate).toEqual([guardInvitado]);
  });

  it('no tiene guardAutenticacion', () => {
    expect(obtenerRutaInicioSesion().canActivate).not.toContain(guardAutenticacion);
  });

  it('no tiene guardRoles', () => {
    expect(obtenerRutaInicioSesion().canActivate).not.toContain(guardRoles);
  });

  it('la ruta no tiene datos de roles', () => {
    expect(obtenerRutaInicioSesion().data).toBeUndefined();
  });

  it('un usuario no autenticado puede activar la ruta', async () => {
    const autenticacionService: AutenticacionServiceMock = {
      estaAutenticado: vi.fn(() => false),
      usuarioActual: signal<UsuarioAutenticado | null>(null).asReadonly(),
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

  it('un usuario autenticado es redirigido a raiz', async () => {
    const autenticacionService: AutenticacionServiceMock = {
      estaAutenticado: vi.fn(() => true),
      usuarioActual: signal<UsuarioAutenticado | null>(crearUsuarioAdmin())
        .asReadonly(),
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

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
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

function crearUsuarioAdmin(): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'activo',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
  };
}
