import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { rutasCarreras } from './carreras.routes';

describe('rutasCarreras', () => {
  it('define ruta de listado autenticada por el layout principal', () => {
    const rutaListado = rutasCarreras.find((ruta) => ruta.path === '');

    expect(rutaListado).toBeTruthy();
    expect(rutaListado?.canActivate).toBeUndefined();
    expect(rutaListado?.title).toBe('Carreras');
  });

  it('protege la creación para ADMIN', () => {
    const rutaCrear = rutasCarreras.find((ruta) => ruta.path === 'crear');

    expect(rutaCrear?.canActivate).toEqual([guardRoles]);
    expect(rutaCrear?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('protege la edición para ADMIN', () => {
    const rutaEditar = rutasCarreras.find((ruta) => ruta.path === 'editar/:id');

    expect(rutaEditar?.canActivate).toEqual([guardRoles]);
    expect(rutaEditar?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('define consulta individual sin guard adicional', () => {
    const rutaDetalle = rutasCarreras.find((ruta) => ruta.path === ':id');

    expect(rutaDetalle).toBeTruthy();
    expect(rutaDetalle?.canActivate).toBeUndefined();
    expect(rutaDetalle?.title).toBe('Detalle de carrera');
  });
});
