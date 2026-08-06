import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasCarreras: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./listado-carreras/listado-carreras.component')
        .then((modulo) => modulo.ListadoCarrerasComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE],
    },
    title: 'Carreras',
  },
  {
    path: 'crear',
    loadComponent: () =>
      import('./pages/crear-carrera/crear-carrera.component')
        .then((modulo) => modulo.CrearCarreraComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Nueva carrera',
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/editar-carrera/editar-carrera.component')
        .then((modulo) => modulo.EditarCarreraComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar carrera',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ver-carrera/ver-carrera.component')
        .then((modulo) => modulo.VerCarreraComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE],
    },
    title: 'Detalle de carrera',
  },
];
