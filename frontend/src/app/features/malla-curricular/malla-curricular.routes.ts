import { Routes } from '@angular/router';

export const rutasMallaCurricular: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./gestion-malla/gestion-malla.component')
        .then((modulo) => modulo.GestionMallaComponent),
    title: 'Malla curricular',
  },
];
