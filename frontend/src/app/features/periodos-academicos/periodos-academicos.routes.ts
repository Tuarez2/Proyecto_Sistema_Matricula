import { Routes } from '@angular/router';

export const rutasPeriodosAcademicos: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./listado-periodos/listado-periodos.component')
        .then((modulo) => modulo.ListadoPeriodosComponent),
    title: 'Periodos académicos',
  },
];
