import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  RespuestaCarrera,
  RespuestaCambioEstadoCarrera,
  RespuestaListadoCarreras,
  SolicitudActualizarCarrera,
  SolicitudCrearCarrera,
} from '../models/carrera.model';

@Injectable({
  providedIn: 'root',
})
export class CarrerasService {
  private readonly http = inject(HttpClient);
  private readonly urlCarreras = obtenerUrlApi('carreras');

  listarCarreras(): Observable<RespuestaListadoCarreras> {
    return this.http.get<RespuestaListadoCarreras>(this.urlCarreras);
  }

  obtenerCarrera(idCarrera: number): Observable<RespuestaCarrera> {
    return this.http.get<RespuestaCarrera>(
      obtenerUrlApi(`carreras/${idCarrera}`),
    );
  }

  crearCarrera(solicitud: SolicitudCrearCarrera): Observable<RespuestaCarrera> {
    return this.http.post<RespuestaCarrera>(this.urlCarreras, solicitud);
  }

  actualizarCarrera(
    idCarrera: number,
    solicitud: SolicitudActualizarCarrera,
  ): Observable<RespuestaCarrera> {
    return this.http.put<RespuestaCarrera>(
      obtenerUrlApi(`carreras/${idCarrera}`),
      solicitud,
    );
  }

  inactivarCarrera(idCarrera: number): Observable<RespuestaCambioEstadoCarrera> {
    return this.http.delete<RespuestaCambioEstadoCarrera>(
      obtenerUrlApi(`carreras/${idCarrera}`),
    );
  }
}
