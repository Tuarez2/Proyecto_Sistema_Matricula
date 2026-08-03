import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  CrearPeriodoAcademicoSolicitud,
  FiltrosListadoPeriodos,
  RespuestaListadoPeriodos,
  RespuestaPeriodoAcademico,
} from '../models/periodo-academico.model';

@Injectable({
  providedIn: 'root',
})
export class PeriodosAcademicosService {
  private readonly http = inject(HttpClient);

  listarPeriodos(
    filtros: FiltrosListadoPeriodos = {},
  ): Observable<RespuestaListadoPeriodos> {
    const params = this.construirParametros(filtros);

    return this.http.get<RespuestaListadoPeriodos>(
      obtenerUrlApi('periodos-academicos'),
      {
        params,
      },
    );
  }

  crearPeriodo(
    solicitud: CrearPeriodoAcademicoSolicitud,
  ): Observable<RespuestaPeriodoAcademico> {
    return this.http.post<RespuestaPeriodoAcademico>(
      obtenerUrlApi('periodos-academicos'),
      solicitud,
    );
  }

  private construirParametros(filtros: FiltrosListadoPeriodos): HttpParams {
    let params = new HttpParams();
    const codigo = filtros.codigo?.trim();
    const nombre = filtros.nombre?.trim();

    if (codigo) {
      params = params.set('codigo', codigo);
    }

    if (nombre) {
      params = params.set('nombre', nombre);
    }

    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (this.esAnioValido(filtros.anio)) {
      params = params.set('anio', String(filtros.anio));
    }

    if (filtros.fechaInicio) {
      params = params.set('fecha_inicio', filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      params = params.set('fecha_fin', filtros.fechaFin);
    }

    if (filtros.pagina !== undefined) {
      params = params.set('page', String(filtros.pagina));
    }

    if (filtros.limite !== undefined) {
      params = params.set('limit', String(filtros.limite));
    }

    return params;
  }

  private esAnioValido(anio: number | undefined): anio is number {
    return anio !== undefined &&
      Number.isInteger(anio) &&
      anio >= 1900 &&
      anio <= 2200;
  }
}
