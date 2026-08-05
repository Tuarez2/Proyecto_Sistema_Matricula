import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  RespuestaAsignatura,
  RespuestaCambioEstadoAsignatura,
  RespuestaListadoAsignaturas,
  SolicitudActualizarAsignatura,
  SolicitudCrearAsignatura,
} from '../models/asignatura.model';

@Injectable({
  providedIn: 'root',
})
export class AsignaturasService {
  private readonly http = inject(HttpClient);
  private readonly urlAsignaturas = obtenerUrlApi('asignaturas');

  listarAsignaturas(): Observable<RespuestaListadoAsignaturas> {
    return this.http.get<RespuestaListadoAsignaturas>(this.urlAsignaturas);
  }

  obtenerAsignatura(idAsignatura: number): Observable<RespuestaAsignatura> {
    return this.http.get<RespuestaAsignatura>(
      obtenerUrlApi(`asignaturas/${idAsignatura}`),
    );
  }

  crearAsignatura(
    solicitud: SolicitudCrearAsignatura,
  ): Observable<RespuestaAsignatura> {
    return this.http.post<RespuestaAsignatura>(this.urlAsignaturas, solicitud);
  }

  actualizarAsignatura(
    idAsignatura: number,
    solicitud: SolicitudActualizarAsignatura,
  ): Observable<RespuestaAsignatura> {
    return this.http.put<RespuestaAsignatura>(
      obtenerUrlApi(`asignaturas/${idAsignatura}`),
      solicitud,
    );
  }

  inactivarAsignatura(
    idAsignatura: number,
  ): Observable<RespuestaCambioEstadoAsignatura> {
    return this.http.delete<RespuestaCambioEstadoAsignatura>(
      obtenerUrlApi(`asignaturas/${idAsignatura}`),
    );
  }
}
