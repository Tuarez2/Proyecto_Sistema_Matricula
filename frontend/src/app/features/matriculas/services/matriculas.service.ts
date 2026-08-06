import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosMatriculas,
  RespuestaCambioEstadoMatricula,
  RespuestaListadoMatriculas,
  RespuestaLoteMatriculas,
  RespuestaMatricula,
  RespuestaResumenMatriculas,
  SolicitudCambiarEstadoMatricula,
  SolicitudCrearMatricula,
  SolicitudCrearMatriculasLote,
} from '../models/matricula.model';

@Injectable({
  providedIn: 'root',
})
export class MatriculasService {
  private readonly http = inject(HttpClient);
  private readonly urlMatriculas = obtenerUrlApi('matriculas');

  listarMatriculas(
    filtros: FiltrosMatriculas = {},
  ): Observable<RespuestaListadoMatriculas> {
    return this.http.get<RespuestaListadoMatriculas>(this.urlMatriculas, {
      params: this.construirParametros(filtros),
    });
  }

  obtenerMatricula(idMatricula: number): Observable<RespuestaMatricula> {
    return this.http.get<RespuestaMatricula>(
      obtenerUrlApi(`matriculas/${idMatricula}`),
    );
  }

  crearMatricula(
    solicitud: SolicitudCrearMatricula,
  ): Observable<RespuestaMatricula> {
    return this.http.post<RespuestaMatricula>(this.urlMatriculas, solicitud);
  }

  crearMatriculasLote(
    solicitud: SolicitudCrearMatriculasLote,
  ): Observable<RespuestaLoteMatriculas> {
    return this.http.post<RespuestaLoteMatriculas>(
      obtenerUrlApi('matriculas/lote'),
      solicitud,
    );
  }

  obtenerResumenMatriculas(): Observable<RespuestaResumenMatriculas> {
    return this.http.get<RespuestaResumenMatriculas>(
      obtenerUrlApi('matriculas/resumen'),
    );
  }

  cambiarEstadoMatricula(
    idMatricula: number,
    solicitud: SolicitudCambiarEstadoMatricula,
  ): Observable<RespuestaCambioEstadoMatricula> {
    return this.http.patch<RespuestaCambioEstadoMatricula>(
      obtenerUrlApi(`matriculas/${idMatricula}/estado`),
      solicitud,
    );
  }

  private construirParametros(filtros: FiltrosMatriculas): HttpParams {
    let parametros = new HttpParams();

    parametros = this.agregarEnteroPositivo(
      parametros,
      'estudiante_id',
      filtros.estudiante_id,
    );
    parametros = this.agregarEnteroPositivo(
      parametros,
      'curso_id',
      filtros.curso_id,
    );
    parametros = this.agregarEnteroPositivo(
      parametros,
      'periodo_id',
      filtros.periodo_id,
    );
    parametros = this.agregarEnteroPositivo(
      parametros,
      'asignatura_id',
      filtros.asignatura_id,
    );
    parametros = this.agregarEnteroPositivo(
      parametros,
      'carrera_id',
      filtros.carrera_id,
    );
    parametros = this.agregarEnteroPositivo(parametros, 'page', filtros.page);
    parametros = this.agregarEnteroPositivo(parametros, 'limit', filtros.limit);
    parametros = this.agregarTexto(parametros, 'estado', filtros.estado);
    parametros = this.agregarTexto(
      parametros,
      'fecha_desde',
      filtros.fecha_desde,
    );
    parametros = this.agregarTexto(
      parametros,
      'fecha_hasta',
      filtros.fecha_hasta,
    );

    return parametros;
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
}
