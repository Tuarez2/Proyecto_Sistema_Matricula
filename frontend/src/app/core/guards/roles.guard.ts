import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
  type CodigoRol,
} from '../config/codigos-rol';
import { RUTA_ACCESO_DENEGADO } from '../config/rutas-por-rol';
import { AutenticacionService } from '../services/autenticacion.service';

export const guardRoles: CanActivateFn = (ruta) => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);
  const rolesPermitidos = obtenerRolesPermitidos(ruta);
  const codigoRolActual = autenticacionService.usuarioActual()?.rol?.codigo;

  if (tieneRolPermitido(codigoRolActual, rolesPermitidos)) {
    return true;
  }

  return router.createUrlTree([RUTA_ACCESO_DENEGADO]);
};

function obtenerRolesPermitidos(ruta: ActivatedRouteSnapshot): CodigoRol[] | null {
  const valorRoles: unknown = ruta.data[CLAVE_ROLES_PERMITIDOS];

  if (!Array.isArray(valorRoles) || valorRoles.length === 0) {
    return null;
  }

  if (!valorRoles.every(esCodigoRol)) {
    return null;
  }

  return valorRoles;
}

function tieneRolPermitido(
  codigoRolActual: string | undefined,
  rolesPermitidos: CodigoRol[] | null,
): boolean {
  if (!rolesPermitidos || !esCodigoRol(codigoRolActual)) {
    return false;
  }

  return rolesPermitidos.includes(codigoRolActual);
}

function esCodigoRol(valor: unknown): valor is CodigoRol {
  return Object.values(CODIGOS_ROL).some((codigoRol) => codigoRol === valor);
}
