import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { CONFIGURACION_API } from '../config/configuracion-api';
import { AutenticacionService } from '../services/autenticacion.service';

export const interceptorTokenAcceso: HttpInterceptorFn = (solicitud, next) => {
  const autenticacionService = inject(AutenticacionService);
  const tokenAcceso = autenticacionService.obtenerTokenAcceso();

  if (
    !tokenAcceso ||
    !esSolicitudApi(solicitud.url) ||
    esEndpointAutenticacionExcluido(solicitud.url) ||
    solicitud.headers.has('Authorization')
  ) {
    return next(solicitud);
  }

  const solicitudConToken = solicitud.clone({
    setHeaders: {
      Authorization: `Bearer ${tokenAcceso}`,
    },
  });

  return next(solicitudConToken);
};

function esSolicitudApi(url: string): boolean {
  return url.startsWith(CONFIGURACION_API.urlBase);
}

function esEndpointAutenticacionExcluido(url: string): boolean {
  return url.startsWith(`${CONFIGURACION_API.urlBase}/auth/login`) ||
    url.startsWith(`${CONFIGURACION_API.urlBase}/auth/refresh`);
}
