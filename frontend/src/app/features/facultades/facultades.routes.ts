import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasFacultades: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./listado-facultades/listado-facultades.component')
        .then((modulo) => modulo.ListadoFacultadesComponent),
    title: 'Facultades',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-facultad/crear-facultad.component')
        .then((modulo) => modulo.CrearFacultadComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Crear facultad',
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/editar-facultad/editar-facultad.component')
        .then((modulo) => modulo.EditarFacultadComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar facultad',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ver-facultad/ver-facultad.component')
        .then((modulo) => modulo.VerFacultadComponent),
    title: 'Detalle de facultad',
  },
];
