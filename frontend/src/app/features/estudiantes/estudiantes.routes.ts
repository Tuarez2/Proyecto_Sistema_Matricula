import { Routes } from '@angular/router';

export const ESTUDIANTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/listar-estudiantes/listar-estudiantes.component').then(m => m.ListarEstudiantesComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./pages/crear-estudiante/crear-estudiante.component').then(m => m.CrearEstudianteComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/editar-estudiante/editar-estudiante.component').then(m => m.EditarEstudianteComponent)
  }
];
