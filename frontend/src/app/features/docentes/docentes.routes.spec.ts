import { CLAVE_ROLES_PERMITIDOS, CODIGOS_ROL } from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { DOCENTES_ROUTES } from './docentes.routes';

describe('DOCENTES_ROUTES', () => {
  it('permite consultar el listado a usuarios autenticados por la ruta padre', () => {
    const rutaListado = DOCENTES_ROUTES.find((ruta) => ruta.path === '');

    expect(rutaListado?.canActivate).toBeUndefined();
    expect(rutaListado?.title).toBe('Docentes');
  });

  it('protege la creacion para ADMIN', () => {
    const rutaCrear = DOCENTES_ROUTES.find((ruta) => ruta.path === 'crear');

    expect(rutaCrear?.canActivate).toEqual([guardRoles]);
    expect(rutaCrear?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('protege la edicion para ADMIN', () => {
    const rutaEditar = DOCENTES_ROUTES.find((ruta) => ruta.path === 'editar/:id');

    expect(rutaEditar?.canActivate).toEqual([guardRoles]);
    expect(rutaEditar?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });
});
