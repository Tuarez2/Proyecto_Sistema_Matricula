import { CONFIGURACION_API, obtenerUrlApi } from './configuracion-api';

describe('obtenerUrlApi', () => {
  it('une la URL base con una ruta sin barra inicial', () => {
    expect(obtenerUrlApi('auth/login')).toBe(
      'http://localhost:3000/api/v1/auth/login',
    );
  });

  it('une la URL base con una ruta con barra inicial', () => {
    expect(obtenerUrlApi('/auth/me')).toBe(
      'http://localhost:3000/api/v1/auth/me',
    );
  });

  it('devuelve la URL base cuando la ruta esta vacia', () => {
    expect(obtenerUrlApi('')).toBe('http://localhost:3000/api/v1');
  });

  it('evita barras duplicadas despues del protocolo', () => {
    const urlApi = obtenerUrlApi('/auth/me');
    const urlSinProtocolo = urlApi.replace('http://', '');

    expect(urlSinProtocolo).not.toContain('//');
  });

  it('no modifica la constante de configuracion', () => {
    const configuracionInicial = { ...CONFIGURACION_API };

    obtenerUrlApi('/auth/me');

    expect(CONFIGURACION_API).toEqual(configuracionInicial);
  });
});
