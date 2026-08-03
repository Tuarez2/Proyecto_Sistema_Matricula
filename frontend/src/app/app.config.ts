import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { interceptorErroresHttp } from './core/interceptors/errores-http.interceptor';
import { interceptorRenovacionSesion } from './core/interceptors/renovacion-sesion.interceptor';
import { interceptorTokenAcceso } from './core/interceptors/token-acceso.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        interceptorTokenAcceso,
        interceptorErroresHttp,
        interceptorRenovacionSesion,
      ]),
    ),
    provideRouter(routes),
  ],
};
