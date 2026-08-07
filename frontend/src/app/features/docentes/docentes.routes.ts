import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const DOCENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/listar-docentes/listar-docentes.component')
        .then((modulo) => modulo.ListarDocentesComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE],
    },
    title: 'Docentes',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-docente/crear-docente.component')
        .then((modulo) => modulo.CrearDocenteComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Nuevo docente',
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/editar-docente/editar-docente.component')
        .then((modulo) => modulo.EditarDocenteComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar docente',
  },
];

