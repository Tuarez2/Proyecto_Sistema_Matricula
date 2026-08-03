import { Routes } from '@angular/router';

export const rutasAutenticacion: Routes = [
  {
    path: 'iniciar-sesion',
    loadComponent: () =>
      import('./inicio-sesion/inicio-sesion.component')
        .then((modulo) => modulo.InicioSesionComponent),
    title: 'Iniciar sesión',
  },
];
