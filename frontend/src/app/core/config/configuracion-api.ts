export const CONFIGURACION_API = Object.freeze({
  urlBase: 'http://localhost:3000/api/v1',
} as const);

export function obtenerUrlApi(ruta: string): string {
  const urlBaseNormalizada = CONFIGURACION_API.urlBase.replace(/\/+$/, '');
  const rutaNormalizada = ruta.replace(/^\/+/, '');

  if (!rutaNormalizada) {
    return urlBaseNormalizada;
  }

  return `${urlBaseNormalizada}/${rutaNormalizada}`;
}
