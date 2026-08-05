import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  RespuestaAsignacion,
  RespuestaAsignaturasCarrera,
  SolicitudActualizarRelacion,
  SolicitudAgregarAsignatura,
} from '../models/malla-curricular.model';

@Injectable({
  providedIn: 'root',
})
export class MallaCurricularService {
  private readonly http = inject(HttpClient);
  private readonly urlCarreraAsignaturas = obtenerUrlApi('carrera-asignaturas');

  consultarAsignaturasCarrera(
    carreraId: number,
    pagina = 1,
    limite = 100,
  ): Observable<RespuestaAsignaturasCarrera> {
    const parametros = new HttpParams()
      .set('page', String(pagina))
      .set('limit', String(limite));

    return this.http.get<RespuestaAsignaturasCarrera>(
      obtenerUrlApi(`carreras/${carreraId}/asignaturas`),
      { params: parametros },
    );
  }

  asignarAsignatura(
    solicitud: SolicitudAgregarAsignatura,
  ): Observable<RespuestaAsignacion> {
    return this.http.post<RespuestaAsignacion>(
      this.urlCarreraAsignaturas,
      solicitud,
    );
  }

  actualizarRelacion(
    idAsignacion: string,
    solicitud: SolicitudActualizarRelacion,
  ): Observable<RespuestaAsignacion> {
    return this.http.put<RespuestaAsignacion>(
      obtenerUrlApi(`carrera-asignaturas/${idAsignacion}`),
      solicitud,
    );
  }

  quitarAsignatura(idAsignacion: string): Observable<RespuestaAsignacion> {
    return this.http.delete<RespuestaAsignacion>(
      obtenerUrlApi(`carrera-asignaturas/${idAsignacion}`),
    );
  }

  construirIdAsignacion(carreraId: number, asignaturaId: number): string {
    return `${carreraId}-${asignaturaId}`;
  }
}
