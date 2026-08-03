import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { CLAVE_ROLES_PERMITIDOS, CODIGOS_ROL } from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
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

  it('no contiene rutas de contrasena', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('password'))).toBe(false);
  });

  it('no contiene rutas de estado', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('estado'))).toBe(false);
  });

  it('no contiene rutas de cambio de contrasena', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('contrasena'))).toBe(false);
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

  it('la ruta nuevo no es interpretada como identificador', () => {
    expect(rutasUsuarios.indexOf(obtenerRutaNuevo())).toBeLessThan(
      rutasUsuarios.indexOf(obtenerRutaEditar()),
    );
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
