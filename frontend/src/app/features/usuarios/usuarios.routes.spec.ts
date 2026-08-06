import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { CLAVE_ROLES_PERMITIDOS, CODIGOS_ROL } from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { CambiarContrasenaUsuarioComponent } from './cambiar-contrasena-usuario/cambiar-contrasena-usuario.component';
import { CambiarEstadoUsuarioComponent } from './cambiar-estado-usuario/cambiar-estado-usuario.component';
import { CrearUsuarioComponent } from './crear-usuario/crear-usuario.component';
import { EditarUsuarioComponent } from './editar-usuario/editar-usuario.component';
import { ListadoUsuariosComponent } from './listado-usuarios/listado-usuarios.component';
import { rutasUsuarios } from './usuarios.routes';

describe('rutasUsuarios', () => {
  it('existe una ruta raiz', () => {
    expect(obtenerRutaRaiz().path).toBe('');
  });

  it('utiliza loadComponent', () => {
    expect(obtenerRutaRaiz().loadComponent).toBeDefined();
  });

  it('carga ListadoUsuariosComponent', async () => {
    const componente = await obtenerRutaRaiz().loadComponent?.();

    expect(componente).toBe(ListadoUsuariosComponent);
  });

  it('tiene titulo Usuarios', () => {
    expect(obtenerRutaRaiz().title).toBe('Usuarios');
  });

  it('utiliza guardRoles', () => {
    expect(obtenerRutaRaiz().canActivate).toEqual([guardRoles]);
  });

  it('permite unicamente ADMIN', () => {
    expect(obtenerRutaRaiz().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaRaiz().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('no contiene rutas de creacion', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('crear'))).toBe(false);
  });

  it('existe una ruta nuevo', () => {
    expect(obtenerRutaNuevo().path).toBe('nuevo');
  });

  it('la ruta nuevo esta antes de la ruta vacia', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaNuevo())).toBeLessThan(
      rutasUsuarios.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta nuevo utiliza loadComponent', () => {
    expect(obtenerRutaNuevo().loadComponent).toBeDefined();
  });

  it('la ruta nuevo carga CrearUsuarioComponent', async () => {
    const componente = await obtenerRutaNuevo().loadComponent?.();

    expect(componente).toBe(CrearUsuarioComponent);
  });

  it('la ruta nuevo tiene titulo Crear usuario', () => {
    expect(obtenerRutaNuevo().title).toBe('Crear usuario');
  });

  it('la ruta nuevo utiliza guardRoles', () => {
    expect(obtenerRutaNuevo().canActivate).toEqual([guardRoles]);
  });

  it('la ruta nuevo permite unicamente ADMIN', () => {
    expect(obtenerRutaNuevo().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la ruta nuevo usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaNuevo().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('existe una ruta editar', () => {
    expect(obtenerRutaEditar().path).toBe(':id/editar');
  });

  it('la ruta editar esta despues de nuevo', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaEditar())).toBeGreaterThan(
      rutasUsuarios.indexOf(obtenerRutaNuevo()),
    );
  });

  it('la ruta editar esta antes de la ruta vacia', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaEditar())).toBeLessThan(
      rutasUsuarios.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta editar utiliza loadComponent', () => {
    expect(obtenerRutaEditar().loadComponent).toBeDefined();
  });

  it('la ruta editar carga EditarUsuarioComponent', async () => {
    const componente = await obtenerRutaEditar().loadComponent?.();

    expect(componente).toBe(EditarUsuarioComponent);
  });

  it('la ruta editar tiene titulo Editar usuario', () => {
    expect(obtenerRutaEditar().title).toBe('Editar usuario');
  });

  it('la ruta editar utiliza guardRoles', () => {
    expect(obtenerRutaEditar().canActivate).toEqual([guardRoles]);
  });

  it('la ruta editar permite unicamente ADMIN', () => {
    expect(obtenerRutaEditar().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la ruta editar usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaEditar().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('existe una ruta estado', () => {
    expect(obtenerRutaEstado().path).toBe(':id/estado');
  });

  it('la ruta estado esta despues de editar', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaEstado())).toBeGreaterThan(
      rutasUsuarios.indexOf(obtenerRutaEditar()),
    );
  });

  it('la ruta estado esta antes de la ruta vacia', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaEstado())).toBeLessThan(
      rutasUsuarios.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta estado usa loadComponent', () => {
    expect(obtenerRutaEstado().loadComponent).toBeDefined();
  });

  it('la ruta estado carga CambiarEstadoUsuarioComponent', async () => {
    const componente = await obtenerRutaEstado().loadComponent?.();

    expect(componente).toBe(CambiarEstadoUsuarioComponent);
  });

  it('la ruta estado tiene titulo Cambiar estado de usuario', () => {
    expect(obtenerRutaEstado().title).toBe('Cambiar estado de usuario');
  });

  it('la ruta estado usa guardRoles', () => {
    expect(obtenerRutaEstado().canActivate).toEqual([guardRoles]);
  });

  it('la ruta estado permite exclusivamente ADMIN', () => {
    expect(obtenerRutaEstado().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la ruta estado usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaEstado().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('existe una ruta contrasena', () => {
    expect(obtenerRutaContrasena().path).toBe(':id/contrasena');
  });

  it('la ruta contrasena esta despues de estado', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaContrasena())).toBeGreaterThan(
      rutasUsuarios.indexOf(obtenerRutaEstado()),
    );
  });

  it('la ruta contrasena esta antes de la ruta vacia', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaContrasena())).toBeLessThan(
      rutasUsuarios.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta contrasena utiliza loadComponent', () => {
    expect(obtenerRutaContrasena().loadComponent).toBeDefined();
  });

  it('la ruta contrasena carga CambiarContrasenaUsuarioComponent', async () => {
    const componente = await obtenerRutaContrasena().loadComponent?.();

    expect(componente).toBe(CambiarContrasenaUsuarioComponent);
  });

  it('la ruta contrasena tiene titulo Cambiar contraseña de usuario', () => {
    expect(obtenerRutaContrasena().title).toBe('Cambiar contraseña de usuario');
  });

  it('la ruta contrasena utiliza guardRoles', () => {
    expect(obtenerRutaContrasena().canActivate).toEqual([guardRoles]);
  });

  it('la ruta contrasena permite unicamente ADMIN', () => {
    expect(obtenerRutaContrasena().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la ruta contrasena usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaContrasena().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('no contiene ruta frontend password', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('password'))).toBe(false);
  });

  it('no contiene rutas de estado distintas a cambio de estado', () => {
    expect(rutasUsuarios.filter((ruta) => ruta.path?.includes('estado')).length).toBe(1);
  });

  it('no contiene rutas de eliminacion', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('eliminar'))).toBe(false);
  });

  it('la ruta del listado continua existiendo', () => {
    expect(obtenerRutaRaiz()).toBeTruthy();
  });

  it('un administrador puede activar usuarios nuevo', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaNuevo()).toBe(true);
  });

  it('otro rol no puede activar usuarios nuevo', () => {
    configurarAutenticacion('DOCENTE');

    expect(ejecutarGuardRutaNuevo()).toBe(false);
  });

  it('un administrador puede activar usuarios editar', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaEditar()).toBe(true);
  });

  it('otro rol no puede activar usuarios editar', () => {
    configurarAutenticacion('DOCENTE');

    expect(ejecutarGuardRutaEditar()).toBe(false);
  });

  it('un administrador puede activar usuarios estado', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaEstado()).toBe(true);
  });

  it('otro rol no puede activar usuarios estado', () => {
    configurarAutenticacion('DOCENTE');

    expect(ejecutarGuardRutaEstado()).toBe(false);
  });

  it('un administrador puede activar usuarios contrasena', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaContrasena()).toBe(true);
  });

  it('otro rol no puede activar usuarios contrasena', () => {
    configurarAutenticacion('DOCENTE');

    expect(ejecutarGuardRutaContrasena()).toBe(false);
  });

  it('la ruta nuevo no es interpretada como identificador', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaNuevo())).toBeLessThan(
      rutasUsuarios.indexOf(obtenerRutaEditar()),
    );
  });

  it('un id invalido queda a cargo del componente de contrasena', () => {
    expect(obtenerRutaContrasena().path).toBe(':id/contrasena');
  });

  it('nuevo editar estado y listado continuan funcionando', async () => {
    expect(await obtenerRutaNuevo().loadComponent?.()).toBe(CrearUsuarioComponent);
    expect(await obtenerRutaEditar().loadComponent?.()).toBe(EditarUsuarioComponent);
    expect(await obtenerRutaEstado().loadComponent?.())
      .toBe(CambiarEstadoUsuarioComponent);
    expect(await obtenerRutaRaiz().loadComponent?.()).toBe(ListadoUsuariosComponent);
  });

  it('la ruta vacia continua existiendo', () => {
    expect(obtenerRutaRaiz().path).toBe('');
  });

  it('no contiene redirects', () => {
    expect(rutasUsuarios.some((ruta) => ruta.redirectTo)).toBe(false);
  });
});

function obtenerRutaRaiz() {
  const ruta = rutasUsuarios.find((rutaActual) => rutaActual.path === '');

  if (!ruta) {
    throw new Error('No existe la ruta raiz de usuarios.');
  }

  return ruta;
}

function obtenerRutaNuevo() {
  const ruta = rutasUsuarios.find((rutaActual) => rutaActual.path === 'nuevo');

  if (!ruta) {
    throw new Error('No existe la ruta nuevo de usuarios.');
  }

  return ruta;
}

function obtenerRutaEditar() {
  const ruta = rutasUsuarios.find((rutaActual) => rutaActual.path === ':id/editar');

  if (!ruta) {
    throw new Error('No existe la ruta editar de usuarios.');
  }

  return ruta;
}

function obtenerRutaEstado() {
  const ruta = rutasUsuarios.find((rutaActual) => rutaActual.path === ':id/estado');

  if (!ruta) {
    throw new Error('No existe la ruta estado de usuarios.');
  }

  return ruta;
}

function obtenerRutaContrasena() {
  const ruta = rutasUsuarios.find(
    (rutaActual) => rutaActual.path === ':id/contrasena',
  );

  if (!ruta) {
    throw new Error('No existe la ruta contrasena de usuarios.');
  }

  return ruta;
}

function configurarAutenticacion(codigoRol: string): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AutenticacionService,
        useValue: {
          usuarioActual: signal<UsuarioAutenticado | null>({
            id: 1,
            nombres: 'Persona',
            apellidos: 'Prueba',
            correo: 'persona.prueba@universidad.edu',
            estado: 'ACTIVO',
            debe_cambiar_password: false,
            estudiante_id: null,
            docente_id: null,
            rol: {
              id: 1,
              codigo: codigoRol,
              nombre: codigoRol,
            },
          }).asReadonly(),
        },
      },
    ],
  });
}

function ejecutarGuardRutaNuevo(): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = obtenerRutaNuevo().data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(ruta, { url: '/usuarios/nuevo' } as RouterStateSnapshot),
  ) as boolean;
}

function ejecutarGuardRutaEditar(): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = obtenerRutaEditar().data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(ruta, { url: '/usuarios/15/editar' } as RouterStateSnapshot),
  ) as boolean;
}

function ejecutarGuardRutaEstado(): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = obtenerRutaEstado().data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(ruta, { url: '/usuarios/15/estado' } as RouterStateSnapshot),
  ) as boolean;
}

function ejecutarGuardRutaContrasena(): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = obtenerRutaContrasena().data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(ruta, { url: '/usuarios/15/contrasena' } as RouterStateSnapshot),
  ) as boolean;
}
