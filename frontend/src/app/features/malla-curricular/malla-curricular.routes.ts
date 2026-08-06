import { Routes } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';

export const rutasMallaCurricular: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./gestion-malla/gestion-malla.component')
        .then((modulo) => modulo.GestionMallaComponent),
    canActivate: [guardRoles],
    data: {
      [CLAVE_ROLES_PERMITIDOS]: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE],
    },
    title: 'Malla curricular',
  },
];
