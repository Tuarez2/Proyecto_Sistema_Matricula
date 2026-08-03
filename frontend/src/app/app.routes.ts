import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';

import { guardAutenticacion } from './core/guards/autenticacion.guard';

export const routes: Routes = [
  {
    matcher: coincidirRutaAutenticacion,
    loadChildren: () =>
      import('./features/autenticacion/autenticacion.routes')
        .then((modulo) => modulo.rutasAutenticacion),
  },
  {
    path: '',
    canActivate: [guardAutenticacion],
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

function coincidirRutaAutenticacion(segmentos: UrlSegment[]): UrlMatchResult | null {
  if (segmentos[0]?.path === 'iniciar-sesion') {
    return {
      consumed: [],
    };
  }

  return null;
}
