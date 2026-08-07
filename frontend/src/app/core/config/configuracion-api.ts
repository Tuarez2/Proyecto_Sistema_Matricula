const URL_API_LOCAL = 'http://localhost:3000/api/v1';

function construirUrlBase(): string {
  const urlPorVariable = import.meta.env?.NG_APP_API_URL?.trim();

  if (urlPorVariable) {
    return urlPorVariable.replace(/\/+$/, '');
  }

  if (typeof window === 'undefined') {
    return URL_API_LOCAL;
  }

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return URL_API_LOCAL;
  }

  return `${window.location.protocol}//${window.location.host}/api/v1`;
}

export const CONFIGURACION_API = Object.freeze({
  urlBase: construirUrlBase(),
} as const);

export function obtenerUrlApi(ruta: string): string {
  const urlBaseNormalizada = CONFIGURACION_API.urlBase.replace(/\/+$/, '');
  const rutaNormalizada = ruta.replace(/^\/+/, '');

  if (!rutaNormalizada) {
    return urlBaseNormalizada;
  }

  return `${urlBaseNormalizada}/${rutaNormalizada}`;
}