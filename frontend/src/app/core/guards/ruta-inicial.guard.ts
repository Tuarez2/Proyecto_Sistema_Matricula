import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { obtenerRutaInicialPorRol } from '../config/rutas-por-rol';
import { AutenticacionService } from '../services/autenticacion.service';

export const guardRutaInicial: CanActivateFn = () => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);
  const codigoRol = autenticacionService.usuarioActual()?.rol?.codigo;
  const rutaInicial = obtenerRutaInicialPorRol(codigoRol);

  if (rutaInicial === '/') {
    return true;
  }

  return router.createUrlTree([rutaInicial]);
};
