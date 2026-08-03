import { Routes } from '@angular/router';

import { guardInvitado } from '../../core/guards/invitado.guard';

export const rutasAutenticacion: Routes = [
  {
    path: 'iniciar-sesion',
    canActivate: [guardInvitado],
    loadComponent: () =>
      import('./inicio-sesion/inicio-sesion.component')
        .then((modulo) => modulo.InicioSesionComponent),
    title: 'Iniciar sesión',
  },
];
