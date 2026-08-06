import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { MATRICULAS_ROUTES } from './matriculas.routes';

describe('MATRICULAS_ROUTES', () => {
  it('protege el listado para ADMIN y GESTOR_MATRICULA', () => {
    const rutaListado = MATRICULAS_ROUTES.find((ruta) => ruta.path === '');

    expect(rutaListado).toBeTruthy();
    expect(rutaListado?.canActivate).toEqual([guardRoles]);
    expect(rutaListado?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
    ]);
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

  it('protege la nueva matrícula para ADMIN y GESTOR_MATRICULA', () => {
    const rutaNueva = MATRICULAS_ROUTES.find((ruta) => ruta.path === 'nueva');

    expect(rutaNueva?.canActivate).toEqual([guardRoles]);
    expect(rutaNueva?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
    ]);
  });

  it('protege la renovación para ADMIN y GESTOR_MATRICULA', () => {
    const rutaRenovar = MATRICULAS_ROUTES.find(
      (ruta) => ruta.path === 'renovar',
    );

    expect(rutaRenovar?.canActivate).toEqual([guardRoles]);
    expect(rutaRenovar?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
    ]);
  });

  it('protege el comprobante para ADMIN, GESTOR_MATRICULA y ESTUDIANTE', () => {
    const rutaImprimir = MATRICULAS_ROUTES.find(
      (ruta) => ruta.path === 'imprimir/:id',
    );

    expect(rutaImprimir).toBeTruthy();
    expect(rutaImprimir?.canActivate).toEqual([guardRoles]);
    expect(rutaImprimir?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
      CODIGOS_ROL.ESTUDIANTE,
    ]);
    expect(rutaImprimir?.title).toBe('Comprobante de matrícula');
  });

  it('protege la consulta individual para ADMIN, GESTOR_MATRICULA y ESTUDIANTE', () => {
    const rutaDetalle = MATRICULAS_ROUTES.find((ruta) => ruta.path === ':id');

    expect(rutaDetalle).toBeTruthy();
    expect(rutaDetalle?.canActivate).toEqual([guardRoles]);
    expect(rutaDetalle?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.GESTOR_MATRICULA,
      CODIGOS_ROL.ESTUDIANTE,
    ]);
    expect(rutaDetalle?.title).toBe('Detalle de matrícula');
  });

  it('no define ruta de edición porque el backend no la expone', () => {
    const rutaEditar = MATRICULAS_ROUTES.find((ruta) =>
      String(ruta.path).includes('editar'),
    );

    expect(rutaEditar).toBeUndefined();
  });
});
