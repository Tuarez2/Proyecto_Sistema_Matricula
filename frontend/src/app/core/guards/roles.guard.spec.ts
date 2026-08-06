import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../config/codigos-rol';
import type {
  RespuestaRenovacionSesion,
  UsuarioAutenticado,
} from '../models/autenticacion.model';
import { AutenticacionService } from '../services/autenticacion.service';
import { guardRoles } from './roles.guard';

interface AutenticacionServiceMock {
  usuarioActual: Signal<UsuarioAutenticado | null>;
  estaAutenticado: Signal<boolean>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
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

describe('guardRoles', () => {
  let estadoUsuario: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let autenticacionService: AutenticacionServiceMock;

  beforeEach(() => {
    estadoUsuario = signal<UsuarioAutenticado | null>(null);
    autenticacionService = {
      usuarioActual: estadoUsuario.asReadonly(),
      estaAutenticado: signal(false).asReadonly(),
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

  it('permite a ADMIN cuando ADMIN esta permitido', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(true);
  });

  it('permite a GESTOR_MATRICULA cuando esta permitido', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.GESTOR_MATRICULA));

    expect(ejecutarGuard([CODIGOS_ROL.GESTOR_MATRICULA])).toBe(true);
  });

  it('permite a ESTUDIANTE cuando esta permitido', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    expect(ejecutarGuard([CODIGOS_ROL.ESTUDIANTE])).toBe(true);
  });

  it('permite a DOCENTE cuando esta permitido', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    expect(ejecutarGuard([CODIGOS_ROL.DOCENTE])).toBe(true);
  });

  it('permite cuando el rol esta dentro de una lista con varios roles', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE])).toBe(true);
  });

  it('deniega cuando el rol actual no esta permitido', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(false);
  });

  it('deniega cuando no existe usuario', () => {
    estadoUsuario.set(null);

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(false);
  });

  it('deniega cuando rol es null', () => {
    estadoUsuario.set(crearUsuario(null));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(false);
  });

  it('deniega cuando no existe rolesPermitidos', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard(undefined)).toBe(false);
  });

  it('deniega cuando rolesPermitidos no es un arreglo', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard(CODIGOS_ROL.ADMIN)).toBe(false);
  });

  it('deniega cuando el arreglo esta vacio', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard([])).toBe(false);
  });

  it('deniega cuando contiene un rol desconocido', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN, 'DESCONOCIDO'])).toBe(false);
  });

  it('deniega cuando contiene valores de tipos incorrectos', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN, 1, null, { codigo: 'ADMIN' }])).toBe(
      false,
    );
  });

  it('deniega cuando el codigo del usuario es desconocido', () => {
    estadoUsuario.set(crearUsuario('DESCONOCIDO'));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(false);
  });

  it('no modifica el usuario', () => {
    const usuario = crearUsuario(CODIGOS_ROL.ADMIN);
    estadoUsuario.set(usuario);

    ejecutarGuard([CODIGOS_ROL.ADMIN]);

    expect(estadoUsuario()).toEqual(usuario);
  });

  it('no limpia la sesion', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    ejecutarGuard([CODIGOS_ROL.ADMIN]);

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('no realiza solicitudes HTTP ni renovaciones', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    ejecutarGuard([CODIGOS_ROL.ADMIN]);

    expect(autenticacionService.renovarSesion).not.toHaveBeenCalled();
  });

  it('puede reevaluar correctamente cuando cambia el usuario', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));
    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(true);

    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));
    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(false);
  });

  it('puede reevaluar correctamente cuando cambian los roles de la ruta', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    expect(ejecutarGuard([CODIGOS_ROL.ADMIN])).toBe(false);
    expect(ejecutarGuard([CODIGOS_ROL.DOCENTE])).toBe(true);
  });

  it('no lanza excepciones ante datos invalidos', () => {
    estadoUsuario.set(crearUsuario(CODIGOS_ROL.ADMIN));

    expect(() => ejecutarGuard({ valor: 'invalido' })).not.toThrow();
    expect(ejecutarGuard({ valor: 'invalido' })).toBe(false);
  });
});

function ejecutarGuard(rolesPermitidos: unknown): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = {
    [CLAVE_ROLES_PERMITIDOS]: rolesPermitidos,
  };

  const resultado = TestBed.runInInjectionContext(() =>
    guardRoles(ruta, {} as RouterStateSnapshot),
  );

  if (typeof resultado !== 'boolean') {
    throw new Error('El guard debe devolver un valor booleano.');
  }

  return resultado;
}
