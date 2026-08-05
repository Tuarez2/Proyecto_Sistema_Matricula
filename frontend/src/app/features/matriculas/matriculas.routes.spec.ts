import { CLAVE_ROLES_PERMITIDOS, CODIGOS_ROL } from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { MATRICULAS_ROUTES } from './matriculas.routes';

describe('MATRICULAS_ROUTES', () => {
  it('define ruta de listado autenticada por el layout principal', () => {
    const rutaListado = MATRICULAS_ROUTES.find((ruta) => ruta.path === '');

    expect(rutaListado).toBeTruthy();
    expect(rutaListado?.canActivate).toBeUndefined();
    expect(rutaListado?.title).toBe('Matrículas');
  });

  it('protege la creación para ADMIN y GESTOR_MATRICULA', () => {
    const rutaCrear = MATRICULAS_ROUTES.find((ruta) => ruta.path === 'crear');

    expect(rutaCrear?.canActivate).toEqual([guardRoles]);
    expect(rutaCrear?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
    ]);
  });

  it('define ruta de consulta individual por identificador', () => {
    const rutaDetalle = MATRICULAS_ROUTES.find((ruta) => ruta.path === ':id');

    expect(rutaDetalle).toBeTruthy();
    expect(rutaDetalle?.canActivate).toBeUndefined();
    expect(rutaDetalle?.title).toBe('Detalle de matrícula');
  });

  it('no define ruta de edición porque el backend no la expone', () => {
    const rutaEditar = MATRICULAS_ROUTES.find((ruta) =>
      String(ruta.path).includes('editar'),
    );

    expect(rutaEditar).toBeUndefined();
  });
});
