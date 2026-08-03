import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AutenticacionService } from '../services/autenticacion.service';

export const guardInvitado: CanActivateFn = () => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);

  return autenticacionService.estaAutenticado()
    ? router.createUrlTree(['/'])
    : true;
};
