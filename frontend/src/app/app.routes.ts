import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/autenticacion/autenticacion.routes')
        .then((modulo) => modulo.rutasAutenticacion),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/layout-principal/layout-principal.component')
        .then((modulo) => modulo.LayoutPrincipalComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/inicio/inicio.component')
            .then((modulo) => modulo.InicioComponent),
        title: 'Inicio',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/pagina-no-encontrada/pagina-no-encontrada.component')
        .then((modulo) => modulo.PaginaNoEncontradaComponent),
    title: 'Página no encontrada',
  },
];
