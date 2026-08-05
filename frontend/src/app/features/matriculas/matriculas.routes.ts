import { Routes } from '@angular/router';

export const MATRICULAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/listar-matriculas/listar-matriculas.component').then(m => m.ListarMatriculasComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./pages/crear-matricula/crear-matricula.component').then(m => m.CrearMatriculaComponent)
  }
];
