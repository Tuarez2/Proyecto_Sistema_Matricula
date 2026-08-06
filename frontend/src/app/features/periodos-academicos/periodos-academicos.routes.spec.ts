import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { CLAVE_ROLES_PERMITIDOS, CODIGOS_ROL } from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import {
  CambiarEstadoPeriodoComponent,
} from './cambiar-estado-periodo/cambiar-estado-periodo.component';
import { CrearPeriodoComponent } from './crear-periodo/crear-periodo.component';
import { EditarPeriodoComponent } from './editar-periodo/editar-periodo.component';
import { ListadoPeriodosComponent } from './listado-periodos/listado-periodos.component';
import { rutasPeriodosAcademicos } from './periodos-academicos.routes';

describe('rutasPeriodosAcademicos', () => {
  it('existe ruta vacia', () => {
    expect(obtenerRutaRaiz().path).toBe('');
  });

  it('utiliza loadComponent', () => {
    expect(obtenerRutaRaiz().loadComponent).toBeDefined();
  });

  it('carga ListadoPeriodosComponent', async () => {
    const componente = await obtenerRutaRaiz().loadComponent?.();

    expect(componente).toBe(ListadoPeriodosComponent);
  });

  it('tiene titulo Periodos academicos', () => {
    expect(obtenerRutaRaiz().title).toBe('Periodos académicos');
  });

  it('no utiliza guardRoles', () => {
    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
  });

  it('no contiene datos de roles', () => {
    expect(obtenerRutaRaiz().data).toBeUndefined();
  });

  it('contiene nuevo, edicion, estado y listado', () => {
    expect(rutasPeriodosAcademicos.map((ruta) => ruta.path)).toEqual([
      'nuevo',
      ':id/editar',
      ':id/estado',
      '',
    ]);
  });

  it('no contiene redirects', () => {
    expect(rutasPeriodosAcademicos.some((ruta) => ruta.redirectTo)).toBe(false);
  });

  it('un usuario autenticado puede activar periodos academicos', () => {
    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
  });

  it('la ruta continua protegida por el layout padre', () => {
    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
  });

  it('existe ruta nuevo', () => {
    expect(obtenerRutaNuevo().path).toBe('nuevo');
  });

  it('la ruta nuevo esta antes de la ruta vacia', () => {
    expect(rutasPeriodosAcademicos.indexOf(obtenerRutaNuevo())).toBeLessThan(
      rutasPeriodosAcademicos.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta nuevo utiliza loadComponent', () => {
    expect(obtenerRutaNuevo().loadComponent).toBeDefined();
  });

  it('la ruta nuevo carga CrearPeriodoComponent', async () => {
    const componente = await obtenerRutaNuevo().loadComponent?.();

    expect(componente).toBe(CrearPeriodoComponent);
  });

  it('la ruta nuevo tiene titulo Crear periodo academico', () => {
    expect(obtenerRutaNuevo().title).toBe('Crear periodo académico');
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

  it('la ruta del listado continua sin guardRoles', () => {
    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
  });

  it.each([
    'GESTOR_MATRICULA',
    'ESTUDIANTE',
    'DOCENTE',
  ])('%s puede consultar listado pero no crear', (codigoRol) => {
    configurarAutenticacion(codigoRol);

    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
    expect(ejecutarGuardRutaNuevo()).toBe(false);
  });

  it('ADMIN puede crear', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaNuevo()).toBe(true);
  });

  it('existe ruta de edicion', () => {
    expect(obtenerRutaEditar().path).toBe(':id/editar');
  });

  it('la ruta edicion esta despues de nuevo', () => {
    expect(rutasPeriodosAcademicos.indexOf(obtenerRutaEditar())).toBeGreaterThan(
      rutasPeriodosAcademicos.indexOf(obtenerRutaNuevo()),
    );
  });

  it('la ruta edicion esta antes de la ruta vacia', () => {
    expect(rutasPeriodosAcademicos.indexOf(obtenerRutaEditar())).toBeLessThan(
      rutasPeriodosAcademicos.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta edicion utiliza loadComponent', () => {
    expect(obtenerRutaEditar().loadComponent).toBeDefined();
  });

  it('la ruta edicion carga EditarPeriodoComponent', async () => {
    const componente = await obtenerRutaEditar().loadComponent?.();

    expect(componente).toBe(EditarPeriodoComponent);
  });

  it('la ruta edicion tiene titulo Editar periodo academico', () => {
    expect(obtenerRutaEditar().title).toBe('Editar periodo académico');
  });

  it('la ruta edicion utiliza guardRoles', () => {
    expect(obtenerRutaEditar().canActivate).toEqual([guardRoles]);
  });

  it('la ruta edicion permite unicamente ADMIN', () => {
    expect(obtenerRutaEditar().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la ruta edicion usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaEditar().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('ADMIN puede editar', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaEditar()).toBe(true);
  });

  it.each([
    'GESTOR_MATRICULA',
    'ESTUDIANTE',
    'DOCENTE',
  ])('%s no puede editar', (codigoRol) => {
    configurarAutenticacion(codigoRol);

    expect(ejecutarGuardRutaEditar()).toBe(false);
  });

  it('la ruta nuevo no se interpreta como ID', () => {
    expect(rutasPeriodosAcademicos[0]).toBe(obtenerRutaNuevo());
    expect(rutasPeriodosAcademicos[1]).toBe(obtenerRutaEditar());
  });

  it('existe ruta de estado', () => {
    expect(obtenerRutaEstado().path).toBe(':id/estado');
  });

  it('la ruta estado esta despues de editar', () => {
    expect(rutasPeriodosAcademicos.indexOf(obtenerRutaEstado())).toBeGreaterThan(
      rutasPeriodosAcademicos.indexOf(obtenerRutaEditar()),
    );
  });

  it('la ruta estado esta antes de la ruta vacia', () => {
    expect(rutasPeriodosAcademicos.indexOf(obtenerRutaEstado())).toBeLessThan(
      rutasPeriodosAcademicos.indexOf(obtenerRutaRaiz()),
    );
  });

  it('la ruta estado utiliza loadComponent', () => {
    expect(obtenerRutaEstado().loadComponent).toBeDefined();
  });

  it('la ruta estado carga CambiarEstadoPeriodoComponent', async () => {
    const componente = await obtenerRutaEstado().loadComponent?.();

    expect(componente).toBe(CambiarEstadoPeriodoComponent);
  });

  it('la ruta estado tiene titulo Cambiar estado de periodo academico', () => {
    expect(obtenerRutaEstado().title).toBe(
      'Cambiar estado de periodo académico',
    );
  });

  it('la ruta estado utiliza guardRoles', () => {
    expect(obtenerRutaEstado().canActivate).toEqual([guardRoles]);
  });

  it('la ruta estado permite unicamente ADMIN', () => {
    expect(obtenerRutaEstado().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la ruta estado usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaEstado().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('ADMIN puede acceder a cambio de estado', () => {
    configurarAutenticacion('ADMIN');

    expect(ejecutarGuardRutaEstado()).toBe(true);
  });

  it.each([
    'GESTOR_MATRICULA',
    'ESTUDIANTE',
    'DOCENTE',
  ])('%s no puede acceder a cambio de estado', (codigoRol) => {
    configurarAutenticacion(codigoRol);

    expect(ejecutarGuardRutaEstado()).toBe(false);
  });

  it('la ruta de edicion continua funcionando', async () => {
    const componente = await obtenerRutaEditar().loadComponent?.();

    expect(componente).toBe(EditarPeriodoComponent);
  });

  it('no existe ruta de eliminacion', () => {
    expect(rutasPeriodosAcademicos.some((ruta) => ruta.path?.includes('eliminar')))
      .toBe(false);
  });
});

function obtenerRutaRaiz() {
  const ruta = rutasPeriodosAcademicos.find((rutaActual) => rutaActual.path === '');

  if (!ruta) {
    throw new Error('No existe la ruta raiz de periodos academicos.');
  }

  return ruta;
}

function obtenerRutaNuevo() {
  const ruta = rutasPeriodosAcademicos.find(
    (rutaActual) => rutaActual.path === 'nuevo',
  );

  if (!ruta) {
    throw new Error('No existe la ruta nuevo de periodos academicos.');
  }

  return ruta;
}

function obtenerRutaEditar() {
  const ruta = rutasPeriodosAcademicos.find(
    (rutaActual) => rutaActual.path === ':id/editar',
  );

  if (!ruta) {
    throw new Error('No existe la ruta editar de periodos academicos.');
  }

  return ruta;
}

function obtenerRutaEstado() {
  const ruta = rutasPeriodosAcademicos.find(
    (rutaActual) => rutaActual.path === ':id/estado',
  );

  if (!ruta) {
    throw new Error('No existe la ruta estado de periodos academicos.');
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
    guardRoles(
      ruta,
      { url: '/periodos-academicos/nuevo' } as RouterStateSnapshot,
    ),
  ) as boolean;
}

function ejecutarGuardRutaEditar(): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = obtenerRutaEditar().data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(
      ruta,
      { url: '/periodos-academicos/15/editar' } as RouterStateSnapshot,
    ),
  ) as boolean;
}

function ejecutarGuardRutaEstado(): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = obtenerRutaEstado().data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(
      ruta,
      { url: '/periodos-academicos/15/estado' } as RouterStateSnapshot,
    ),
  ) as boolean;
}
