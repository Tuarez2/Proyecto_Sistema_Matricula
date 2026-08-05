import { Routes } from '@angular/router';

export const DOCENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/listar-docentes/listar-docentes.component').then(m => m.ListarDocentesComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./pages/crear-docente/crear-docente.component').then(m => m.CrearDocenteComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/editar-docente/editar-docente.component').then(m => m.EditarDocenteComponent)
  }
];

