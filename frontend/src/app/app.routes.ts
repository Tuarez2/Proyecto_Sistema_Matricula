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
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes')
            .then((modulo) => modulo.rutasUsuarios),
      },
      {
        path: 'periodos-academicos',
        loadChildren: () =>
          import('./features/periodos-academicos/periodos-academicos.routes')
            .then((modulo) => modulo.rutasPeriodosAcademicos),
      },
      {
        path: 'facultades',
        loadChildren: () => import('./features/facultades/facultades.routes').then((modulo) => modulo.rutasFacultades),
      },
      {
        path: 'carreras',
        loadChildren: () => import('./features/carreras/carreras.routes').then((modulo) => modulo.rutasCarreras),
      },
      {
        path: 'asignaturas',
        loadChildren: () => import('./features/asignaturas/asignaturas.routes').then((modulo) => modulo.rutasAsignaturas),
      },
      {
        path: 'malla-curricular',
        loadChildren: () => import('./features/malla-curricular/malla-curricular.routes').then((modulo) => modulo.rutasMallaCurricular),
      },
      {
        path: 'cursos',
        loadChildren: () => import('./features/cursos/cursos.routes').then((modulo) => modulo.rutasCursos),
      },
      {
        path: 'estudiantes',
        loadChildren: () => import('./features/estudiantes/estudiantes.routes').then(m => m.ESTUDIANTES_ROUTES),
      },
      {
        path: 'docentes',
        loadChildren: () => import('./features/docentes/docentes.routes').then(m => m.DOCENTES_ROUTES),
      },
      {
        path: 'matriculas',
        loadChildren: () => import('./features/matriculas/matriculas.routes').then(m => m.MATRICULAS_ROUTES)
      }
      
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
