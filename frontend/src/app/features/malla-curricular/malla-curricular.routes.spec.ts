import {
  CLAVE_ROLES_PERMITIDOS,
  CODIGOS_ROL,
} from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { rutasMallaCurricular } from './malla-curricular.routes';

describe('rutasMallaCurricular', () => {
  it('define la ruta de consulta y gestión protegida por rol', () => {
    const rutaMalla = rutasMallaCurricular.find((ruta) => ruta.path === '');

    expect(rutaMalla).toBeTruthy();
    expect(rutaMalla?.canActivate).toEqual([guardRoles]);
    expect(rutaMalla?.data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
      CODIGOS_ROL.DOCENTE,
    ]);
    expect(rutaMalla?.title).toBe('Malla curricular');
  });

  it('expone solo una ruta para el módulo de malla', () => {
    expect(rutasMallaCurricular).toHaveLength(1);
    expect(rutasMallaCurricular[0]?.path).toBe('');
  });
});
