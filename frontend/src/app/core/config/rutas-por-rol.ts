import { CODIGOS_ROL } from './codigos-rol';

export const RUTA_ACCESO_DENEGADO = '/acceso-denegado';

export function obtenerRutaInicialPorRol(
  codigoRol: string | null | undefined,
): string {
  switch (codigoRol) {
    case CODIGOS_ROL.ADMIN:
      return '/';
    case CODIGOS_ROL.GESTOR_MATRICULA:
      return '/dashboard-gestor';
    case CODIGOS_ROL.ESTUDIANTE:
      return '/portal-estudiante';
    case CODIGOS_ROL.DOCENTE:
      return '/';
    default:
      return RUTA_ACCESO_DENEGADO;
  }
}
