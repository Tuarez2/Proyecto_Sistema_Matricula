import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasCursos: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./listado-cursos/listado-cursos.component').then(
        (modulo) => modulo.ListadoCursosComponent,
      ),
    title: 'Cursos',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-curso/crear-curso.component').then(
        (modulo) => modulo.CrearCursoComponent,
      ),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Crear curso',
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/editar-curso/editar-curso.component').then(
        (modulo) => modulo.EditarCursoComponent,
      ),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar curso',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ver-curso/ver-curso.component').then(
        (modulo) => modulo.VerCursoComponent,
      ),
    title: 'Detalle de curso',
  },
];
