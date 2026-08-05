import { rutasMallaCurricular } from './malla-curricular.routes';

describe('rutasMallaCurricular', () => {
  it('define la ruta de consulta y gestión autenticada por el layout principal', () => {
    const rutaMalla = rutasMallaCurricular.find((ruta) => ruta.path === '');

    expect(rutaMalla).toBeTruthy();
    expect(rutaMalla?.canActivate).toBeUndefined();
    expect(rutaMalla?.title).toBe('Malla curricular');
  });

  it('expone solo una ruta para el módulo de malla', () => {
    expect(rutasMallaCurricular).toHaveLength(1);
    expect(rutasMallaCurricular[0]?.path).toBe('');
  });
});
