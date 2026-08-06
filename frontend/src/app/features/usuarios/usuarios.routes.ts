import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasUsuarios: Routes = [
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./crear-usuario/crear-usuario.component')
        .then((modulo) => modulo.CrearUsuarioComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Nuevo usuario',
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./editar-usuario/editar-usuario.component')
        .then((modulo) => modulo.EditarUsuarioComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Editar usuario',
  },
  {
    path: ':id/estado',
    loadComponent: () =>
      import('./cambiar-estado-usuario/cambiar-estado-usuario.component')
        .then((modulo) => modulo.CambiarEstadoUsuarioComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Cambiar estado de usuario',
  },
  {
    path: ':id/contrasena',
    loadComponent: () =>
      import('./cambiar-contrasena-usuario/cambiar-contrasena-usuario.component')
        .then((modulo) => modulo.CambiarContrasenaUsuarioComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN],
    },
    title: 'Cambiar contraseña de usuario',
  },
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
