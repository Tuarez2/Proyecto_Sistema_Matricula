import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { rutasCursos } from './cursos.routes';

describe('rutasCursos', () => {
  it('define ruta de listado autenticada por el layout principal', () => {
    const rutaListado = rutasCursos.find((ruta) => ruta.path === '');

    expect(rutaListado).toBeTruthy();
    expect(rutaListado?.canActivate).toBeUndefined();
    expect(rutaListado?.title).toBe('Cursos');
  });

  it('protege la creación para ADMIN', () => {
    const rutaCrear = rutasCursos.find((ruta) => ruta.path === 'crear');

    expect(rutaCrear?.canActivate).toEqual([guardRoles]);
    expect(rutaCrear?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
    expect(rutaCrear?.title).toBe('Crear curso');
  });

  it('protege la edición para ADMIN', () => {
    const rutaEditar = rutasCursos.find(
      (ruta) => ruta.path === 'editar/:id',
    );

    expect(rutaEditar?.canActivate).toEqual([guardRoles]);
    expect(rutaEditar?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
    expect(rutaEditar?.title).toBe('Editar curso');
  });

  it('define consulta individual sin guard adicional', () => {
    const rutaDetalle = rutasCursos.find((ruta) => ruta.path === ':id');

    expect(rutaDetalle).toBeTruthy();
    expect(rutaDetalle?.canActivate).toBeUndefined();
    expect(rutaDetalle?.title).toBe('Detalle de curso');
  });
});
