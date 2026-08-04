import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type { FiltrosFacultades, RespuestaFacultad, RespuestaListadoFacultades, SolicitudFacultad } from '../models/facultad.model';

@Injectable({ providedIn: 'root' })
export class FacultadesService {
  private readonly http = inject(HttpClient);
  listarFacultades(filtros: FiltrosFacultades = {}): Observable<RespuestaListadoFacultades> {
    let params = new HttpParams();
    if (filtros.codigo) params = params.set('codigo', filtros.codigo);
    if (filtros.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros.activo !== undefined) params = params.set('activo', String(filtros.activo));
    if (filtros.pagina) params = params.set('page', String(filtros.pagina));
    if (filtros.limite) params = params.set('limit', String(filtros.limite));
    return this.http.get<RespuestaListadoFacultades>(obtenerUrlApi('facultades'), { params });
  }
  crearFacultad(solicitud: SolicitudFacultad): Observable<RespuestaFacultad> { return this.http.post<RespuestaFacultad>(obtenerUrlApi('facultades'), solicitud); }
  actualizarFacultad(id: number, solicitud: Partial<SolicitudFacultad>): Observable<RespuestaFacultad> { return this.http.put<RespuestaFacultad>(obtenerUrlApi(`facultades/${id}`), solicitud); }
  cambiarEstadoFacultad(id: number, activo: boolean): Observable<RespuestaFacultad> { return this.http.patch<RespuestaFacultad>(obtenerUrlApi(`facultades/${id}/estado`), { activo }); }
}
