const URL_API_POR_DEFECTO = 'http://localhost:3000/api/v1';

function obtenerUrlBase(): string {
  const urlDesdeVariable = import.meta.env?.NG_APP_API_URL?.trim();

  if (urlDesdeVariable) {
    return urlDesdeVariable.replace(/\/+$/, '');
  }

  return URL_API_POR_DEFECTO;
}

export const CONFIGURACION_API = Object.freeze({
  urlBase: obtenerUrlBase(),
} as const);

export function obtenerUrlApi(ruta: string): string {
  const urlBaseNormalizada = CONFIGURACION_API.urlBase.replace(/\/+$/, '');
  const rutaNormalizada = ruta.replace(/^\/+/, '');

  if (!rutaNormalizada) {
    return urlBaseNormalizada;
  }

  return `${urlBaseNormalizada}/${rutaNormalizada}`;
}
