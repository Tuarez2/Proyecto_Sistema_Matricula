import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { AutenticacionService } from '../services/autenticacion.service';

export const guardAutenticacion: CanActivateFn = () => {
  const autenticacionService = inject(AutenticacionService);

  return autenticacionService.estaAutenticado();
};
