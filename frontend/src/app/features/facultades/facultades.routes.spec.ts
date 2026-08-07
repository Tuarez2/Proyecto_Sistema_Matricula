import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { rutasFacultades } from './facultades.routes';

describe('rutasFacultades', () => {
  it('define ruta de listado protegida por rol de consulta', () => {
    const rutaListado = rutasFacultades.find((ruta) => ruta.path === '');

    expect(rutaListado).toBeTruthy();
    expect(rutaListado?.canActivate).toEqual([guardRoles]);
    expect(rutaListado?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.DOCENTE,
    ]);
    expect(rutaListado?.title).toBe('Facultades');
  });

  it('protege la creación para ADMIN', () => {
    const rutaCrear = rutasFacultades.find((ruta) => ruta.path === 'crear');

    expect(rutaCrear?.canActivate).toEqual([guardRoles]);
    expect(rutaCrear?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('protege la edición para ADMIN', () => {
    const rutaEditar = rutasFacultades.find((ruta) => ruta.path === 'editar/:id');

    expect(rutaEditar?.canActivate).toEqual([guardRoles]);
    expect(rutaEditar?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('define consulta individual protegida por rol de consulta', () => {
    const rutaDetalle = rutasFacultades.find((ruta) => ruta.path === ':id');

    expect(rutaDetalle).toBeTruthy();
    expect(rutaDetalle?.canActivate).toEqual([guardRoles]);
    expect(rutaDetalle?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.DOCENTE,
    ]);
    expect(rutaDetalle?.title).toBe('Detalle de facultad');
  });
});
