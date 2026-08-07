import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosFacultades,
  RespuestaCambioEstadoFacultad,
  RespuestaFacultad,
  RespuestaListadoFacultades,
  SolicitudActualizarFacultad,
  SolicitudCambiarEstadoFacultad,
  SolicitudCrearFacultad,
} from '../models/facultad.model';

@Injectable({
  providedIn: 'root',
})
export class FacultadesService {
  private readonly http = inject(HttpClient);
  private readonly urlFacultades = obtenerUrlApi('facultades');

  listarFacultades(
    filtros: FiltrosFacultades = {},
  ): Observable<RespuestaListadoFacultades> {
    return this.http.get<RespuestaListadoFacultades>(this.urlFacultades, {
      params: this.construirParametros(filtros),
    });
  }

  obtenerFacultad(idFacultad: number): Observable<RespuestaFacultad> {
    return this.http.get<RespuestaFacultad>(
      obtenerUrlApi(`facultades/${idFacultad}`),
    );
  }

  crearFacultad(
    solicitud: SolicitudCrearFacultad,
  ): Observable<RespuestaFacultad> {
    return this.http.post<RespuestaFacultad>(this.urlFacultades, solicitud);
  }

  actualizarFacultad(
    idFacultad: number,
    solicitud: SolicitudActualizarFacultad,
  ): Observable<RespuestaFacultad> {
    return this.http.put<RespuestaFacultad>(
      obtenerUrlApi(`facultades/${idFacultad}`),
      solicitud,
    );
  }

  cambiarEstadoFacultad(
    idFacultad: number,
    solicitud: SolicitudCambiarEstadoFacultad,
  ): Observable<RespuestaCambioEstadoFacultad> {
    return this.http.patch<RespuestaCambioEstadoFacultad>(
      obtenerUrlApi(`facultades/${idFacultad}/estado`),
      solicitud,
    );
  }

  private construirParametros(filtros: FiltrosFacultades): HttpParams {
    let parametros = new HttpParams();

    parametros = this.agregarTexto(parametros, 'codigo', filtros.codigo);
    parametros = this.agregarTexto(parametros, 'nombre', filtros.nombre);

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
