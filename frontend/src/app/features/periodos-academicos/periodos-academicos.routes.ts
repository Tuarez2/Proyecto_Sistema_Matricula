import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasPeriodosAcademicos: Routes = [
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./crear-periodo/crear-periodo.component')
        .then((modulo) => modulo.CrearPeriodoComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Crear periodo académico',
  },
  {
    path: '',
    loadComponent: () =>
      import('./listado-periodos/listado-periodos.component')
        .then((modulo) => modulo.ListadoPeriodosComponent),
    title: 'Periodos académicos',
  },
];
