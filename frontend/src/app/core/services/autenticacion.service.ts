import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';

import { obtenerUrlApi } from '../config/configuracion-api';
import type {
  CredencialesInicioSesion,
  DatosAutenticacion,
  RespuestaCierreSesion,
  RespuestaInicioSesion,
  RespuestaPerfilAutenticado,
  RespuestaRenovacionSesion,
  SolicitudRenovacionSesion,
} from '../models/autenticacion.model';
import { AlmacenamientoSesionService } from './almacenamiento-sesion.service';

@Injectable({
  providedIn: 'root',
})
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly almacenamientoSesion = inject(AlmacenamientoSesionService);
  private readonly estadoSesion = signal<DatosAutenticacion | null>(
    this.almacenamientoSesion.obtenerSesion(),
  );

  readonly sesionActual = this.estadoSesion.asReadonly();
  readonly usuarioActual = computed(() => this.estadoSesion()?.user ?? null);
  readonly estaAutenticado = computed(() => this.estadoSesion() !== null);

  inicializarSesion(): Observable<void> {
    if (!this.estaAutenticado()) {
      return of(void 0);
    }

    return this.consultarPerfil().pipe(
      map(() => void 0),
      catchError((errorInicializacion: unknown) => {
        if (
          errorInicializacion instanceof HttpErrorResponse &&
          errorInicializacion.status === 401
        ) {
          this.limpiarSesion();
        }

        return of(void 0);
      }),
    );
  }

  iniciarSesion(
    credenciales: CredencialesInicioSesion,
  ): Observable<RespuestaInicioSesion> {
    return this.http
      .post<RespuestaInicioSesion>(obtenerUrlApi('auth/login'), credenciales)
      .pipe(
        tap((respuesta) => {
          this.guardarDatosSesion(respuesta.data);
        }),
      );
  }

  renovarSesion(): Observable<RespuestaRenovacionSesion> {
    const refreshToken = this.almacenamientoSesion.obtenerTokenRenovacion();

    if (!refreshToken) {
      this.limpiarSesion();
      return throwError(() => new Error('No existe una sesion valida para renovar.'));
    }

    const solicitudRenovacion: SolicitudRenovacionSesion = { refreshToken };

    return this.http
      .post<RespuestaRenovacionSesion>(
        obtenerUrlApi('auth/refresh'),
        solicitudRenovacion,
      )
      .pipe(
        tap((respuesta) => {
          this.guardarDatosSesion(respuesta.data);
        }),
      );
  }

  consultarPerfil(): Observable<RespuestaPerfilAutenticado> {
    return this.http
      .get<RespuestaPerfilAutenticado>(obtenerUrlApi('auth/me'))
      .pipe(
        tap((respuesta) => {
          const usuario = respuesta.data?.user;
          const sesionActual = this.estadoSesion();

          if (!usuario || !sesionActual) {
            return;
          }

          this.guardarDatosSesion({
            ...sesionActual,
            user: usuario,
          });
        }),
      );
  }

  cerrarSesion(): Observable<RespuestaCierreSesion> {
    return this.http
      .post<RespuestaCierreSesion>(obtenerUrlApi('auth/logout'), {})
      .pipe(finalize(() => this.limpiarSesion()));
  }

  limpiarSesion(): void {
    this.almacenamientoSesion.eliminarSesion();
    this.estadoSesion.set(null);
  }

  obtenerTokenAcceso(): string | null {
    return this.almacenamientoSesion.obtenerTokenAcceso();
  }

  obtenerTokenRenovacion(): string | null {
    return this.almacenamientoSesion.obtenerTokenRenovacion();
  }

  private guardarDatosSesion(datosSesion: DatosAutenticacion | undefined): void {
    if (!datosSesion) {
      return;
    }

    this.almacenamientoSesion.guardarSesion(datosSesion);
    this.estadoSesion.set(datosSesion);
  }
}
