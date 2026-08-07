import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AutenticacionService } from '../services/autenticacion.service';

export const guardAutenticacion: CanActivateFn = (_ruta, estado) => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);

  if (autenticacionService.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/iniciar-sesion'], {
    queryParams: {
      retorno: estado.url,
    },
  });
};
