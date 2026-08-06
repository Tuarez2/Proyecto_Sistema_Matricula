import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { rutasAsignaturas } from './asignaturas.routes';

describe('rutasAsignaturas', () => {
  it('define ruta de listado protegida por rol de consulta', () => {
    const rutaListado = rutasAsignaturas.find((ruta) => ruta.path === '');

    expect(rutaListado).toBeTruthy();
    expect(rutaListado?.canActivate).toEqual([guardRoles]);
    expect(rutaListado?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.DOCENTE,
    ]);
    expect(rutaListado?.title).toBe('Asignaturas');
  });

  it('protege la creación para ADMIN', () => {
    const rutaCrear = rutasAsignaturas.find((ruta) => ruta.path === 'crear');

    expect(rutaCrear?.canActivate).toEqual([guardRoles]);
    expect(rutaCrear?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('protege la edición para ADMIN', () => {
    const rutaEditar = rutasAsignaturas.find(
      (ruta) => ruta.path === 'editar/:id',
    );

    expect(rutaEditar?.canActivate).toEqual([guardRoles]);
    expect(rutaEditar?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('define consulta individual protegida por rol de consulta', () => {
    const rutaDetalle = rutasAsignaturas.find((ruta) => ruta.path === ':id');

    expect(rutaDetalle).toBeTruthy();
    expect(rutaDetalle?.canActivate).toEqual([guardRoles]);
    expect(rutaDetalle?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.DOCENTE,
    ]);
    expect(rutaDetalle?.title).toBe('Detalle de asignatura');
  });
});