import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const MATRICULAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/listar-matriculas/listar-matriculas.component')
        .then((modulo) => modulo.ListarMatriculasComponent),
    title: 'Matrículas',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-matricula/crear-matricula.component')
        .then((modulo) => modulo.CrearMatriculaComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [
        CODIGOS_ROL.ADMIN,
        CODIGOS_ROL.GESTOR_MATRICULA,
      ],
    },
    title: 'Crear matrícula',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ver-matricula/ver-matricula.component')
        .then((modulo) => modulo.VerMatriculaComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [
        CODIGOS_ROL.ADMIN,
        CODIGOS_ROL.GESTOR_MATRICULA,
        CODIGOS_ROL.ESTUDIANTE,
      ],
    },
    title: 'Detalle de matrícula',
  },
];
