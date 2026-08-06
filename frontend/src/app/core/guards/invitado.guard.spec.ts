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
  RespuestaPerfilAutenticado,
  RespuestaRenovacionSesion,
  UsuarioAutenticado,
} from '../models/autenticacion.model';
import { AutenticacionService } from '../services/autenticacion.service';
import { CODIGOS_ROL } from '../config/codigos-rol';
import { guardInvitado } from './invitado.guard';

interface AutenticacionServiceMock {
  estaAutenticado: Signal<boolean>;
  usuarioActual: Signal<UsuarioAutenticado | null>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
  consultarPerfil: ReturnType<typeof vi.fn<() => Observable<RespuestaPerfilAutenticado>>>;
  renovarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaRenovacionSesion>>>;
}

interface RouterNavegacion {
  navigate: ReturnType<typeof vi.fn>;
  navigateByUrl: ReturnType<typeof vi.fn>;
}

function crearUsuario(codigoRol: string | null): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'ACTIVO',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: codigoRol
      ? {
          id: 1,
          codigo: codigoRol,
          nombre: 'Rol de prueba',
        }
      : null,
  };
}

describe('guardInvitado', () => {
  let estadoAutenticacion: ReturnType<typeof signal<boolean>>;
  let estadoUsuario: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let autenticacionService: AutenticacionServiceMock;
  let router: Router;
  let routerNavegacion: RouterNavegacion;

  beforeEach(() => {
    estadoAutenticacion = signal(false);
    estadoUsuario = signal<UsuarioAutenticado | null>(null);
    autenticacionService = {
      estaAutenticado: estadoAutenticacion.asReadonly(),
      usuarioActual: estadoUsuario.asReadonly(),
      limpiarSesion: vi.fn(() => estadoAutenticacion.set(false)),
      consultarPerfil: vi.fn(),
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

  it('devuelve true cuando no existe sesion', () => {
    estadoAutenticacion.set(false);

    expect(ejecutarGuard()).toBe(true);
  });

  it('devuelve un UrlTree cuando existe sesion', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard()).toBeInstanceOf(UrlTree);
  });

  it('redirige a ADMIN hacia la raiz', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(serializarResultado(ejecutarGuard())).toBe('/');
  });

  it('redirige a DOCENTE hacia la raiz', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    expect(serializarResultado(ejecutarGuard())).toBe('/');
  });

  it('redirige a GESTOR_MATRICULA hacia su dashboard', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.GESTOR_MATRICULA));

    expect(serializarResultado(ejecutarGuard())).toBe('/dashboard-gestor');
  });

  it('redirige a ESTUDIANTE hacia su portal', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    expect(serializarResultado(ejecutarGuard())).toBe('/portal-estudiante');
  });

  it('redirige a acceso denegado cuando el rol es desconocido', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(null));

    expect(serializarResultado(ejecutarGuard())).toBe('/acceso-denegado');
  });

  it('consulta el valor actual en cada ejecucion', () => {
    estadoAutenticacion.set(false);
    expect(ejecutarGuard()).toBe(true);

    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));
    expect(ejecutarGuard()).toBeInstanceOf(UrlTree);
  });

  it('permite volver al login despues de ejecutar limpiarSesion', () => {
    estadoAutenticacion.set(true);
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));
    expect(ejecutarGuard()).toBeInstanceOf(UrlTree);

    autenticacionService.limpiarSesion();

    expect(ejecutarGuard()).toBe(true);
  });

  it('no limpia la sesion por si mismo', () => {
    estadoAutenticacion.set(true);

    ejecutarGuard();

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('no consulta el perfil', () => {
    ejecutarGuard();

    expect(autenticacionService.consultarPerfil).not.toHaveBeenCalled();
  });

  it('no renueva la sesion', () => {
    ejecutarGuard();

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('no ejecuta navegacion imperativa', () => {
    ejecutarGuard();

    expect(routerNavegacion.navigate).not.toHaveBeenCalled();
    expect(routerNavegacion.navigateByUrl).not.toHaveBeenCalled();
  });

  it('puede ejecutarse varias veces', () => {
    estadoAutenticacion.set(false);

    expect(ejecutarGuard()).toBe(true);
    expect(ejecutarGuard()).toBe(true);
    expect(ejecutarGuard()).toBe(true);
  });

  function ejecutarGuard(): boolean | UrlTree {
    const estado = { url: '/iniciar-sesion' } as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() =>
      guardInvitado(new ActivatedRouteSnapshot(), estado),
    ) as boolean | UrlTree;
  }

  function serializarResultado(resultado: boolean | UrlTree): string {
    if (typeof resultado === 'boolean') {
      throw new Error('Se esperaba un UrlTree.');
    }

    return router.serializeUrl(resultado);
  }
});
