import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosCursos,
  RespuestaCambioEstadoCurso,
  RespuestaCurso,
  RespuestaListadoCursos,
  SolicitudActualizarCurso,
  SolicitudCrearCurso,
} from '../models/curso.model';

@Injectable({
  providedIn: 'root',
})
export class CursosService {
  private readonly http = inject(HttpClient);
  private readonly urlCursos = obtenerUrlApi('cursos');

  listar(filtros: FiltrosCursos = {}): Observable<RespuestaListadoCursos> {
    return this.http.get<RespuestaListadoCursos>(this.urlCursos, {
      params: this.construirParametros(filtros),
    });
  }

  obtenerCurso(idCurso: number): Observable<RespuestaCurso> {
    return this.http.get<RespuestaCurso>(obtenerUrlApi(`cursos/${idCurso}`));
  }

  crearCurso(solicitud: SolicitudCrearCurso): Observable<RespuestaCurso> {
    return this.http.post<RespuestaCurso>(this.urlCursos, solicitud);
  }

  actualizarCurso(
    idCurso: number,
    solicitud: SolicitudActualizarCurso,
  ): Observable<RespuestaCurso> {
    return this.http.put<RespuestaCurso>(
      obtenerUrlApi(`cursos/${idCurso}`),
      solicitud,
    );
  }

  cancelarCurso(idCurso: number): Observable<RespuestaCambioEstadoCurso> {
    return this.http.delete<RespuestaCambioEstadoCurso>(
      obtenerUrlApi(`cursos/${idCurso}`),
    );
  }

  private construirParametros(filtros: FiltrosCursos): HttpParams {
    let parametros = new HttpParams();

    if (filtros.periodo_id !== undefined) {
      parametros = parametros.set('periodo_id', String(filtros.periodo_id));
    }

    if (filtros.asignatura_id !== undefined) {
      parametros = parametros.set(
        'asignatura_id',
        String(filtros.asignatura_id),
      );
    }

    if (filtros.docente_id !== undefined) {
      parametros = parametros.set('docente_id', String(filtros.docente_id));
    }

    if (filtros.estado !== undefined) {
      parametros = parametros.set('estado', filtros.estado);
    }

    const paralelo = filtros.paralelo?.trim();

    if (paralelo) {
      parametros = parametros.set('paralelo', paralelo);
    }

    if (filtros.pagina !== undefined) {
      parametros = parametros.set('page', String(filtros.pagina));
    }

    if (filtros.limite !== undefined) {
      parametros = parametros.set('limit', String(filtros.limite));
    }

    return parametros;
  }
}
