import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const ESTUDIANTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/listar-estudiantes/listar-estudiantes.component')
        .then((modulo) => modulo.ListarEstudiantesComponent),
    title: 'Estudiantes',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-estudiante/crear-estudiante.component')
        .then((modulo) => modulo.CrearEstudianteComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Crear estudiante',
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/editar-estudiantes/editar-estudiante.component')
        .then((modulo) => modulo.EditarEstudianteComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar estudiante',
  },
];
