import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';

import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
  type CodigoRol,
} from '../config/codigos-rol';
import { AutenticacionService } from '../services/autenticacion.service';

export const guardRoles: CanActivateFn = (ruta) => {
  const autenticacionService = inject(AutenticacionService);
  const rolesPermitidos = obtenerRolesPermitidos(ruta);
  const codigoRolActual = autenticacionService.usuarioActual()?.rol?.codigo;

  return tieneRolPermitido(codigoRolActual, rolesPermitidos);
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
