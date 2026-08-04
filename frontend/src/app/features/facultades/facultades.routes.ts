import { Routes } from '@angular/router';
export const rutasFacultades: Routes = [{ path: '', loadComponent: () => import('./listado-facultades/listado-facultades.component').then(m => m.ListadoFacultadesComponent), title: 'Facultades' }];
