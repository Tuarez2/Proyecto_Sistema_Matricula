import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { CrearEstudianteComponent } from './pages/crear-estudiante/crear-estudiante.component';
import { EditarEstudianteComponent } from './pages/editar-estudiantes/editar-estudiante.component';
import { ListarEstudiantesComponent } from './pages/listar-estudiantes/listar-estudiantes.component';
import { VerEstudianteComponent } from './pages/ver-estudiante/ver-estudiante.component';
import { ESTUDIANTES_ROUTES } from './estudiantes.routes';

describe('ESTUDIANTES_ROUTES', () => {
  it('contiene listado, detalle, creacion y edicion', () => {
    expect(ESTUDIANTES_ROUTES.map((ruta) => ruta.path)).toEqual([
      '',
      ':id',
      'crear',
      'editar/:id',
    ]);
  });

  it('el listado protege por rol de consulta', () => {
    expect(obtenerRutaListado().canActivate).toEqual([guardRoles]);
    expect(obtenerRutaListado().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
      CODIGOS_ROL.DOCENTE,
    ]);
  });

  it('carga ListarEstudiantesComponent', async () => {
    const componente = await obtenerRutaListado().loadComponent?.();

    expect(componente).toBe(ListarEstudiantesComponent);
  });

  it('el detalle carga VerEstudianteComponent', async () => {
    const componente = await obtenerRutaDetalle().loadComponent?.();

    expect(componente).toBe(VerEstudianteComponent);
  });

  it('el detalle permite consulta de admin, gestor y docente', () => {
    expect(obtenerRutaDetalle().canActivate).toEqual([guardRoles]);
    expect(obtenerRutaDetalle().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
      CODIGOS_ROL.DOCENTE,
    ]);
  });

  it('la creacion permite solo ADMIN', () => {
    expect(obtenerRutaCrear().canActivate).toEqual([guardRoles]);
    expect(obtenerRutaCrear().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('la edicion permite solo ADMIN', () => {
    expect(obtenerRutaEditar().canActivate).toEqual([guardRoles]);
    expect(obtenerRutaEditar().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('ADMIN puede listar, ver, crear y editar', () => {
    configurarAutenticacion(CODIGOS_ROL.ADMIN);

    expect(ejecutarGuard(obtenerRutaListado(), '/estudiantes')).toBe(true);
    expect(ejecutarGuard(obtenerRutaDetalle(), '/estudiantes/15')).toBe(true);
    expect(ejecutarGuard(obtenerRutaCrear(), '/estudiantes/crear')).toBe(true);
    expect(ejecutarGuard(obtenerRutaEditar(), '/estudiantes/editar/15')).toBe(true);
  });

  it('GESTOR_MATRICULA puede listar y ver pero no crear ni editar', () => {
    configurarAutenticacion(CODIGOS_ROL.GESTOR_MATRICULA);

    expect(ejecutarGuard(obtenerRutaListado(), '/estudiantes')).toBe(true);
    expect(ejecutarGuard(obtenerRutaDetalle(), '/estudiantes/15')).toBe(true);
    expectDenegado(obtenerRutaCrear(), '/estudiantes/crear');
    expectDenegado(obtenerRutaEditar(), '/estudiantes/editar/15');
  });

  it('DOCENTE puede listar y ver pero no crear ni editar', () => {
    configurarAutenticacion(CODIGOS_ROL.DOCENTE);

    expect(ejecutarGuard(obtenerRutaListado(), '/estudiantes')).toBe(true);
    expect(ejecutarGuard(obtenerRutaDetalle(), '/estudiantes/15')).toBe(true);
    expectDenegado(obtenerRutaCrear(), '/estudiantes/crear');
    expectDenegado(obtenerRutaEditar(), '/estudiantes/editar/15');
  });

  it('ESTUDIANTE no puede listar ni ver estudiantes', () => {
    configurarAutenticacion(CODIGOS_ROL.ESTUDIANTE);

    expectDenegado(obtenerRutaListado(), '/estudiantes');
    expectDenegado(obtenerRutaDetalle(), '/estudiantes/15');
  });

  it('carga CrearEstudianteComponent y EditarEstudianteComponent', async () => {
    const crear = await obtenerRutaCrear().loadComponent?.();
    const editar = await obtenerRutaEditar().loadComponent?.();

    expect(crear).toBe(CrearEstudianteComponent);
    expect(editar).toBe(EditarEstudianteComponent);
  });
});

function obtenerRutaListado() {
  const ruta = ESTUDIANTES_ROUTES.find((rutaActual) => rutaActual.path === '');

  if (!ruta) {
    throw new Error('No existe la ruta de listado de estudiantes.');
  }

  return ruta;
}

function obtenerRutaDetalle() {
  const ruta = ESTUDIANTES_ROUTES.find((rutaActual) => rutaActual.path === ':id');

  if (!ruta) {
    throw new Error('No existe la ruta de detalle de estudiantes.');
  }

  return ruta;
}

function obtenerRutaCrear() {
  const ruta = ESTUDIANTES_ROUTES.find((rutaActual) => rutaActual.path === 'crear');

  if (!ruta) {
    throw new Error('No existe la ruta de creacion de estudiantes.');
  }

  return ruta;
}

function obtenerRutaEditar() {
  const ruta = ESTUDIANTES_ROUTES.find(
    (rutaActual) => rutaActual.path === 'editar/:id',
  );

  if (!ruta) {
    throw new Error('No existe la ruta de edicion de estudiantes.');
  }

  return ruta;
}

function configurarAutenticacion(codigoRol: string): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AutenticacionService,
        useValue: {
          usuarioActual: signal<UsuarioAutenticado | null>({
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
              codigo: codigoRol,
              nombre: codigoRol,
            },
          }).asReadonly(),
        },
      },
    ],
  });
}

function ejecutarGuard(
  rutaConfigurada: { data?: Record<string, unknown> },
  url: string,
): boolean | UrlTree {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = rutaConfigurada.data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(ruta, { url } as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

function expectDenegado(
  rutaConfigurada: { data?: Record<string, unknown> },
  url: string,
): void {
  const resultado = ejecutarGuard(rutaConfigurada, url);

  expect(resultado instanceof UrlTree).toBe(true);
}
