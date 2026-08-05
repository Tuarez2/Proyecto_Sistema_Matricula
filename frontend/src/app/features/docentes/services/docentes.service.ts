import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  Docente,
  FiltrosDocentes,
  RespuestaCambioEstadoDocente,
  RespuestaDocente,
  RespuestaListadoDocentes,
  SolicitudActualizarDocente,
  SolicitudCrearDocente,
} from '../models/docente.model';

@Injectable({
  providedIn: 'root',
})
export class DocentesService {
  private readonly http = inject(HttpClient);
  private readonly urlDocentes = obtenerUrlApi('docentes');

  listarDocentes(
    filtros: FiltrosDocentes = {},
  ): Observable<RespuestaListadoDocentes> {
    return this.http.get<RespuestaListadoDocentes>(this.urlDocentes, {
      params: this.construirParametros(filtros),
    });
  }

  obtenerDocente(idDocente: number): Observable<RespuestaDocente> {
    return this.http.get<RespuestaDocente>(
      obtenerUrlApi(`docentes/${idDocente}`),
    );
  }

  crearDocente(solicitud: SolicitudCrearDocente): Observable<RespuestaDocente> {
    return this.http.post<RespuestaDocente>(this.urlDocentes, solicitud);
  }

  actualizarDocente(
    idDocente: number,
    solicitud: SolicitudActualizarDocente,
  ): Observable<RespuestaDocente> {
    return this.http.put<RespuestaDocente>(
      obtenerUrlApi(`docentes/${idDocente}`),
      solicitud,
    );
  }

  cambiarEstadoDocente(
    idDocente: number,
    activo: boolean,
  ): Observable<RespuestaCambioEstadoDocente> {
    if (activo) {
      return this.actualizarDocente(idDocente, { activo });
    }

    return this.http.delete<RespuestaCambioEstadoDocente>(
      obtenerUrlApi(`docentes/${idDocente}`),
    );
  }

  private construirParametros(filtros: FiltrosDocentes): HttpParams {
    let parametros = new HttpParams();

    parametros = this.agregarTexto(
      parametros,
      'identificacion',
      filtros.identificacion,
    );
    parametros = this.agregarTexto(parametros, 'nombres', filtros.nombres);
    parametros = this.agregarTexto(parametros, 'apellidos', filtros.apellidos);
    parametros = this.agregarTexto(parametros, 'correo', filtros.correo);
    parametros = this.agregarTexto(
      parametros,
      'especialidad',
      filtros.especialidad,
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
