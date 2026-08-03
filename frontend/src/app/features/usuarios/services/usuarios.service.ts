import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosListadoUsuarios,
  RespuestaListadoUsuarios,
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly http = inject(HttpClient);

  listarUsuarios(
    filtros: FiltrosListadoUsuarios = {},
  ): Observable<RespuestaListadoUsuarios> {
    const params = this.construirParametros(filtros);

    return this.http.get<RespuestaListadoUsuarios>(obtenerUrlApi('usuarios'), {
      params,
    });
  }

  private construirParametros(filtros: FiltrosListadoUsuarios): HttpParams {
    let params = new HttpParams();
    const correo = filtros.correo?.trim();

    if (correo) {
      params = params.set('correo', correo);
    }

    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros.codigoRol) {
      params = params.set('rol', filtros.codigoRol);
    }

    if (filtros.pagina !== undefined) {
      params = params.set('page', String(filtros.pagina));
    }

    if (filtros.limite !== undefined) {
      params = params.set('limit', String(filtros.limite));
    }

    return params;
  }
}
