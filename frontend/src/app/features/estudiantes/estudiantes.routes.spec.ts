import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

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
import { ESTUDIANTES_ROUTES } from './estudiantes.routes';

describe('ESTUDIANTES_ROUTES', () => {
  it('contiene listado, creacion y edicion', () => {
    expect(ESTUDIANTES_ROUTES.map((ruta) => ruta.path)).toEqual([
      '',
      'crear',
      'editar/:id',
    ]);
  });

  it('el listado no usa guardRoles porque el backend permite consulta autenticada', () => {
    expect(obtenerRutaListado().canActivate).toBeUndefined();
    expect(obtenerRutaListado().data).toBeUndefined();
  });

  it('carga ListarEstudiantesComponent', async () => {
    const componente = await obtenerRutaListado().loadComponent?.();

    expect(componente).toBe(ListarEstudiantesComponent);
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

  it('ADMIN puede crear y editar', () => {
    configurarAutenticacion(CODIGOS_ROL.ADMIN);

    expect(ejecutarGuard(obtenerRutaCrear(), '/estudiantes/crear')).toBe(true);
    expect(ejecutarGuard(obtenerRutaEditar(), '/estudiantes/editar/15')).toBe(true);
  });

  it.each([
    CODIGOS_ROL.GESTOR_MATRICULA,
    CODIGOS_ROL.ESTUDIANTE,
    CODIGOS_ROL.DOCENTE,
  ])('%s no puede crear ni editar', (codigoRol) => {
    configurarAutenticacion(codigoRol);

    expect(ejecutarGuard(obtenerRutaCrear(), '/estudiantes/crear')).toBe(false);
    expect(ejecutarGuard(obtenerRutaEditar(), '/estudiantes/editar/15')).toBe(false);
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

function ejecutarGuard(rutaConfigurada: {
  data?: Record<string, unknown>;
}, url: string): boolean {
  const ruta = new ActivatedRouteSnapshot();

  ruta.data = rutaConfigurada.data ?? {};

  return TestBed.runInInjectionContext(() =>
    guardRoles(
      ruta,
      { url } as RouterStateSnapshot,
    ),
  ) as boolean;
}
