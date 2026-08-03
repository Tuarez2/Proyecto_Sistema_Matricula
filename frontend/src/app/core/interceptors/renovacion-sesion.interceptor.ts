import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { CONFIGURACION_API } from '../config/configuracion-api';
import { AutenticacionService } from '../services/autenticacion.service';
import { CoordinadorRenovacionSesionService } from '../services/coordinador-renovacion-sesion.service';

const SOLICITUD_REINTENTADA = new HttpContextToken<boolean>(() => false);

export const interceptorRenovacionSesion: HttpInterceptorFn = (solicitud, next) => {
  const autenticacionService = inject(AutenticacionService);
  const coordinadorRenovacionSesion = inject(CoordinadorRenovacionSesionService);

  return next(solicitud).pipe(
    catchError((error: unknown) => {
      if (
        !debeIntentarRenovacion(error, solicitud.url) ||
        solicitud.context.get(SOLICITUD_REINTENTADA)
      ) {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          solicitud.context.get(SOLICITUD_REINTENTADA)
        ) {
          autenticacionService.limpiarSesion();
        }

        return throwError(() => error);
      }

      if (!autenticacionService.obtenerTokenRenovacion()) {
        autenticacionService.limpiarSesion();
        return throwError(() => error);
      }

      return coordinadorRenovacionSesion.renovarSesionCompartida().pipe(
        switchMap(() => {
          const tokenAcceso = autenticacionService.obtenerTokenAcceso();

          if (!tokenAcceso) {
            autenticacionService.limpiarSesion();
            return throwError(
              () => new Error('No fue posible reintentar la solicitud.'),
            );
          }

          const solicitudReintentada = solicitud.clone({
            context: solicitud.context.set(SOLICITUD_REINTENTADA, true),
            setHeaders: {
              Authorization: `Bearer ${tokenAcceso}`,
            },
          });

          return next(solicitudReintentada);
        }),
        catchError((errorRenovacion: unknown) => {
          autenticacionService.limpiarSesion();
          return throwError(() => errorRenovacion);
        }),
      );
    }),
  );
};

function debeIntentarRenovacion(error: unknown, url: string): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    esSolicitudApi(url) &&
    !esEndpointRenovacionExcluido(url)
  );
}

function esSolicitudApi(url: string): boolean {
  return url.startsWith(CONFIGURACION_API.urlBase);
}

function esEndpointRenovacionExcluido(url: string): boolean {
  return url.startsWith(`${CONFIGURACION_API.urlBase}/auth/login`) ||
    url.startsWith(`${CONFIGURACION_API.urlBase}/auth/refresh`);
}
