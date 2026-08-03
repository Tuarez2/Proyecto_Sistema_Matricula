import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasUsuarios: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./listado-usuarios/listado-usuarios.component')
        .then((modulo) => modulo.ListadoUsuariosComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Usuarios',
  },
];
