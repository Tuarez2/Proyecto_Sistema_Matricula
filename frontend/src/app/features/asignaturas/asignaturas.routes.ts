import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasAsignaturas: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./listado-asignaturas/listado-asignaturas.component')
        .then((modulo) => modulo.ListadoAsignaturasComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE],
    },
    title: 'Asignaturas',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-asignatura/crear-asignatura.component')
        .then((modulo) => modulo.CrearAsignaturaComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Nueva asignatura',
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/editar-asignatura/editar-asignatura.component')
        .then((modulo) => modulo.EditarAsignaturaComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar asignatura',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ver-asignatura/ver-asignatura.component')
        .then((modulo) => modulo.VerAsignaturaComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE],
    },
    title: 'Detalle de asignatura',
  },
];
