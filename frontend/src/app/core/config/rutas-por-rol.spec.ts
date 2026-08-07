import { CODIGOS_ROL } from './codigos-rol';
import {
  obtenerRutaInicialPorRol,
  RUTA_ACCESO_DENEGADO,
} from './rutas-por-rol';

describe('rutas-por-rol', () => {
  describe('obtenerRutaInicialPorRol', () => {
    it('devuelve la raiz para ADMIN', () => {
      expect(obtenerRutaInicialPorRol(CODIGOS_ROL.ADMIN)).toBe('/');
    });

    it('devuelve el dashboard para GESTOR_MATRICULA', () => {
      expect(obtenerRutaInicialPorRol(CODIGOS_ROL.GESTOR_MATRICULA)).toBe(
        '/dashboard-gestor',
      );
    });

    it('devuelve el portal para ESTUDIANTE', () => {
      expect(obtenerRutaInicialPorRol(CODIGOS_ROL.ESTUDIANTE)).toBe(
        '/portal-estudiante',
      );
    });

    it('devuelve la raiz para DOCENTE', () => {
      expect(obtenerRutaInicialPorRol(CODIGOS_ROL.DOCENTE)).toBe('/');
    });

    it.each([undefined, null, '', 'DESCONOCIDO'])(
      'devuelve acceso denegado para %s',
      (codigoRol) => {
        expect(obtenerRutaInicialPorRol(codigoRol)).toBe(RUTA_ACCESO_DENEGADO);
      },
    );
  });

  it('expone la ruta de acceso denegado', () => {
    expect(RUTA_ACCESO_DENEGADO).toBe('/acceso-denegado');
  });
});
