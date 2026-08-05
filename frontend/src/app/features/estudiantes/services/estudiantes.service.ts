import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import {
  type Estudiante,
  type FiltrosEstudiantes,
  type RespuestaEstudiante,
  type RespuestaListadoEstudiantes,
  type SolicitudActualizarEstudiante,
  type SolicitudCrearEstudiante,
} from '../models/estudiante.model';

@Injectable({
  providedIn: 'root',
})
export class EstudiantesService {
  private readonly http = inject(HttpClient);
  private readonly urlEstudiantes = obtenerUrlApi('estudiantes');

  listarEstudiantes(
    filtros: FiltrosEstudiantes = {},
  ): Observable<RespuestaListadoEstudiantes> {
    return this.http.get<RespuestaListadoEstudiantes>(this.urlEstudiantes, {
      params: this.construirParametros(filtros),
    });
  }

  obtenerEstudiante(idEstudiante: number): Observable<RespuestaEstudiante> {
    return this.http.get<RespuestaEstudiante>(
      obtenerUrlApi(`estudiantes/${idEstudiante}`),
    );
  }

  crearEstudiante(
    solicitud: SolicitudCrearEstudiante,
  ): Observable<RespuestaEstudiante> {
    return this.http.post<RespuestaEstudiante>(
      this.urlEstudiantes,
      solicitud,
    );
  }

  actualizarEstudiante(
    idEstudiante: number,
    solicitud: SolicitudActualizarEstudiante,
  ): Observable<RespuestaEstudiante> {
    return this.http.put<RespuestaEstudiante>(
      obtenerUrlApi(`estudiantes/${idEstudiante}`),
      solicitud,
    );
  }

  cambiarEstadoEstudiante(
    idEstudiante: number,
  ): Observable<RespuestaEstudiante> {
    return this.http.delete<RespuestaEstudiante>(
      obtenerUrlApi(`estudiantes/${idEstudiante}`),
    );
  }

  private construirParametros(filtros: FiltrosEstudiantes): HttpParams {
    let parametros = new HttpParams();

    parametros = this.agregarTexto(
      parametros,
      'numero_matricula',
      filtros.numero_matricula,
    );
    parametros = this.agregarTexto(
      parametros,
      'identificacion',
      filtros.identificacion,
    );
    parametros = this.agregarTexto(parametros, 'nombres', filtros.nombres);
    parametros = this.agregarTexto(parametros, 'apellidos', filtros.apellidos);
    parametros = this.agregarTexto(parametros, 'correo', filtros.correo);
    parametros = this.agregarEnteroPositivo(
      parametros,
      'carrera_id',
      filtros.carrera_id,
    );

    if (filtros.estado_academico) {
      parametros = parametros.set(
        'estado_academico',
        filtros.estado_academico,
      );
    }

    parametros = this.agregarEnteroPositivo(
      parametros,
      'nivel_academico_actual',
      filtros.nivel_academico_actual,
    );
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
