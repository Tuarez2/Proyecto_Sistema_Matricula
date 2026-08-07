import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { obtenerRutaInicialPorRol } from '../config/rutas-por-rol';
import { AutenticacionService } from '../services/autenticacion.service';

export const guardInvitado: CanActivateFn = () => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);

  if (!autenticacionService.estaAutenticado()) {
    return true;
  }

  const codigoRol = autenticacionService.usuarioActual()?.rol?.codigo;

  return router.createUrlTree([obtenerRutaInicialPorRol(codigoRol)]);
};
