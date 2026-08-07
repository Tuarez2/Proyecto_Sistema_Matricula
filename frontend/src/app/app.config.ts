import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { interceptorErroresHttp } from './core/interceptors/errores-http.interceptor';
import { interceptorRenovacionSesion } from './core/interceptors/renovacion-sesion.interceptor';
import { interceptorTokenAcceso } from './core/interceptors/token-acceso.interceptor';
import { AutenticacionService } from './core/services/autenticacion.service';
import { PreferenciasService } from './core/services/preferencias.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        interceptorTokenAcceso,
        interceptorErroresHttp,
        interceptorRenovacionSesion,
      ]),
    ),
    provideAppInitializer(() => {
      const autenticacionService = inject(AutenticacionService);
      return autenticacionService.inicializarSesion();
    }),
    provideAppInitializer(() => {
      const preferenciasService = inject(PreferenciasService);
      preferenciasService.suscribirseACambiosDeSistema();
    }),
    provideRouter(routes),
  ],
};
