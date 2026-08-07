import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosCarreras,
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

  listarCarreras(
    filtros: FiltrosCarreras = {},
  ): Observable<RespuestaListadoCarreras> {
    return this.http.get<RespuestaListadoCarreras>(this.urlCarreras, {
      params: this.construirParametros(filtros),
    });
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

  private construirParametros(filtros: FiltrosCarreras): HttpParams {
    let parametros = new HttpParams();

    parametros = this.agregarTexto(parametros, 'codigo', filtros.codigo);
    parametros = this.agregarTexto(parametros, 'nombre', filtros.nombre);

    if (filtros.facultad_id !== undefined) {
      parametros = parametros.set('facultad_id', String(filtros.facultad_id));
    }

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
