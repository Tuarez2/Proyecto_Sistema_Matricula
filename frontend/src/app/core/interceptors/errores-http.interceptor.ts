import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { CONFIGURACION_API } from '../config/configuracion-api';
import type {
  ErrorHttpGlobal,
  TipoErrorHttpGlobal,
} from '../models/error-http-global.model';
import { ManejadorErroresHttpService } from '../services/manejador-errores-http.service';

export const interceptorErroresHttp: HttpInterceptorFn = (solicitud, next) => {
  const manejadorErroresHttp = inject(ManejadorErroresHttpService);

  return next(solicitud).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && debeRegistrarError(error, solicitud.url)) {
        manejadorErroresHttp.registrarError(crearErrorHttpGlobal(error));
      }

      return throwError(() => error);
    }),
  );
};

function debeRegistrarError(error: HttpErrorResponse, url: string): boolean {
  if (!url.startsWith(CONFIGURACION_API.urlBase)) {
    return false;
  }

  if (error.status === 401 && url.startsWith(`${CONFIGURACION_API.urlBase}/auth/login`)) {
    return false;
  }

  return error.status === 401 || error.status === 403 || error.status === 429;
}

function crearErrorHttpGlobal(error: HttpErrorResponse): ErrorHttpGlobal {
  const estadoHttp = error.status as 401 | 403 | 429;
  const cuerpoError: unknown = error.error;

  return {
    tipo: obtenerTipoError(estadoHttp),
    estadoHttp,
    mensaje: obtenerMensajeError(cuerpoError, estadoHttp),
    codigo: obtenerCodigoError(cuerpoError),
    detalles: obtenerDetallesError(cuerpoError),
    reintentarDespuesSegundos: obtenerReintentoDespues(error),
    marcaTiempo: Date.now(),
  };
}

function obtenerTipoError(estadoHttp: 401 | 403 | 429): TipoErrorHttpGlobal {
  if (estadoHttp === 401) {
    return 'SESION_NO_AUTORIZADA';
  }

  if (estadoHttp === 403) {
    return 'ACCESO_PROHIBIDO';
  }

  return 'DEMASIADAS_SOLICITUDES';
}

function obtenerMensajeError(
  cuerpoError: unknown,
  estadoHttp: 401 | 403 | 429,
): string {
  if (esRegistro(cuerpoError) && esTexto(cuerpoError['message'])) {
    return cuerpoError['message'];
  }

  if (estadoHttp === 401) {
    return 'La sesión no es válida o ha expirado.';
  }

  if (estadoHttp === 403) {
    return 'No tiene permisos para realizar esta acción.';
  }

  return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
}

function obtenerCodigoError(cuerpoError: unknown): string | null {
  if (esRegistro(cuerpoError) && esTexto(cuerpoError['code'])) {
    return cuerpoError['code'];
  }

  return null;
}

function obtenerDetallesError(cuerpoError: unknown): unknown {
  if (esRegistro(cuerpoError) && 'details' in cuerpoError) {
    return cuerpoError['details'];
  }

  return null;
}

function obtenerReintentoDespues(error: HttpErrorResponse): number | null {
  const valorEncabezado = error.headers.get('Retry-After');

  if (!valorEncabezado) {
    return null;
  }

  const segundos = Number(valorEncabezado);

  if (!Number.isInteger(segundos) || segundos <= 0) {
    return null;
  }

  return segundos;
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0;
}
