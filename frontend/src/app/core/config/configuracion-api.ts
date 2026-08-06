// Marcador temporal reemplazado en el build de despliegue por scripts/configurar-api.mjs.
// Si queda sin reemplazar (desarrollo local), no es una URL válida y se usa la lógica local.
const URL_API_DESPLIEGUE = '__URL_API_DESPLIEGUE__';
const URL_BASE_LOCAL = 'http://localhost:3000/api/v1';
const PUERTO_API = 3000;

function obtenerHostActual(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }

  const hostname = window.location.hostname;

  return hostname.length > 0 ? hostname : 'localhost';
}

function construirUrlBase(): string {
  const urlDespliegue = URL_API_DESPLIEGUE.trim();

  if (urlDespliegue.startsWith('http://') || urlDespliegue.startsWith('https://')) {
    return urlDespliegue;
  }

  const hostname = obtenerHostActual();

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return URL_BASE_LOCAL;
  }

  return `http://${hostname}:${PUERTO_API}/api/v1`;
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