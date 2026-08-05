import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosAsignaturas,
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

  listarAsignaturas(
    filtros: FiltrosAsignaturas = {},
  ): Observable<RespuestaListadoAsignaturas> {
    return this.http.get<RespuestaListadoAsignaturas>(this.urlAsignaturas, {
      params: this.construirParametros(filtros),
    });
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

  private construirParametros(filtros: FiltrosAsignaturas): HttpParams {
    let parametros = new HttpParams();

    parametros = this.agregarTexto(parametros, 'codigo', filtros.codigo);
    parametros = this.agregarTexto(parametros, 'nombre', filtros.nombre);
    parametros = this.agregarEnteroPositivo(
      parametros,
      'creditos',
      filtros.creditos,
    );
    parametros = this.agregarEnteroPositivo(
      parametros,
      'nivel_academico',
      filtros.nivel_academico,
    );

    if (filtros.activo !== undefined) {
      parametros = parametros.set('activo', String(filtros.activo));
    }

    parametros = this.agregarEnteroPositivo(
      parametros,
      'page',
      filtros.pagina,
    );
    parametros = this.agregarEnteroPositivo(
      parametros,
      'limit',
      filtros.limite,
    );

    return parametros;
  }

  private agregarTexto(
    parametros: HttpParams,
    nombre: string,
    valor: string | undefined,
  ): HttpParams {
    const valorNormalizado = valor?.trim();

    if (!valorNormalizado) {
      return parametros;
    }

    return parametros.set(nombre, valorNormalizado);
  }

  private agregarEnteroPositivo(
    parametros: HttpParams,
    nombre: string,
    valor: number | undefined,
  ): HttpParams {
    if (valor === undefined || !Number.isInteger(valor) || valor < 1) {
      return parametros;
    }

    return parametros.set(nombre, String(valor));
  }
}
