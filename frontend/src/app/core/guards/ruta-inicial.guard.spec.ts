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

import { CODIGOS_ROL } from '../config/codigos-rol';
import type {
  RespuestaPerfilAutenticado,
  RespuestaRenovacionSesion,
  UsuarioAutenticado,
} from '../models/autenticacion.model';
import { AutenticacionService } from '../services/autenticacion.service';
import { guardRutaInicial } from './ruta-inicial.guard';

interface AutenticacionServiceMock {
  usuarioActual: Signal<UsuarioAutenticado | null>;
  estaAutenticado: Signal<boolean>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
  consultarPerfil: ReturnType<typeof vi.fn<() => Observable<RespuestaPerfilAutenticado>>>;
  renovarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaRenovacionSesion>>>;
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

describe('guardRutaInicial', () => {
  let estadoUsuario: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let autenticacionService: AutenticacionServiceMock;
  let router: Router;

  beforeEach(() => {
    estadoUsuario = signal<UsuarioAutenticado | null>(null);
    autenticacionService = {
      usuarioActual: estadoUsuario.asReadonly(),
      estaAutenticado: signal(true).asReadonly(),
      limpiarSesion: vi.fn(),
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
  });

  it('permite cuando la ruta inicial del rol es la raiz', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard()).toBe(true);
  });

  it('permite a DOCENTE porque su inicio es la raiz', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a GESTOR_MATRICULA hacia su dashboard', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.GESTOR_MATRICULA));

    expect(serializarResultado(ejecutarGuard())).toBe('/dashboard-gestor');
  });

  it('redirige a ESTUDIANTE hacia su portal', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    expect(serializarResultado(ejecutarGuard())).toBe('/portal-estudiante');
  });

  it('redirige a acceso denegado cuando el rol es desconocido', () => {
    estadoUsuario.set(crearUsuario(null));

    expect(serializarResultado(ejecutarGuard())).toBe('/acceso-denegado');
  });

  it('redirige a acceso denegado cuando no existe usuario', () => {
    estadoUsuario.set(null);

    expect(serializarResultado(ejecutarGuard())).toBe('/acceso-denegado');
  });

  it('no realiza navegacion imperativa', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    ejecutarGuard();

    expect(vi.spyOn(router, 'navigateByUrl')).not.toHaveBeenCalled();
  });
});

function ejecutarGuard(): boolean | UrlTree {
  const estado = { url: '/' } as RouterStateSnapshot;

  return TestBed.runInInjectionContext(() =>
    guardRutaInicial(new ActivatedRouteSnapshot(), estado),
  ) as boolean | UrlTree;
}

function serializarResultado(resultado: boolean | UrlTree): string {
  if (typeof resultado === 'boolean') {
    throw new Error('Se esperaba un UrlTree.');
  }

  return TestBed.inject(Router).serializeUrl(resultado);
}
