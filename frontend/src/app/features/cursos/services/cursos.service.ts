import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type { Curso, EstadoCurso, RespuestaCurso, RespuestaListadoCursos, SolicitudCurso } from '../models/curso.model';

@Injectable({ providedIn: 'root' })
export class CursosService {
  private readonly http = inject(HttpClient);

  // Método adaptador para obtener la lista de cursos como un arreglo de Curso
  getCursos(filtros?: { estado?: string }): Observable<Curso[]> {
    const estado = filtros?.estado as EstadoCurso;
    return this.listar({ estado }).pipe(
      map((respuesta) => respuesta.data ?? [])
    );
  }

  listar(f: { periodoId?: number; asignaturaId?: number; docenteId?: number; estado?: EstadoCurso; pagina?: number; limite?: number } = {}): Observable<RespuestaListadoCursos> {
    let p = new HttpParams();
    if (f.periodoId) p = p.set('periodo_id', f.periodoId);
    if (f.asignaturaId) p = p.set('asignatura_id', f.asignaturaId);
    if (f.docenteId) p = p.set('docente_id', f.docenteId);
    if (f.estado) p = p.set('estado', f.estado);
    if (f.pagina) p = p.set('page', f.pagina);
    if (f.limite) p = p.set('limit', f.limite);
    return this.http.get<RespuestaListadoCursos>(obtenerUrlApi('cursos'), { params: p });
  }

  crear(s: SolicitudCurso): Observable<RespuestaCurso> {
    return this.http.post<RespuestaCurso>(obtenerUrlApi('cursos'), s);
  }

  actualizar(id: number, s: Partial<SolicitudCurso>): Observable<RespuestaCurso> {
    return this.http.put<RespuestaCurso>(obtenerUrlApi(`cursos/${id}`), s);
  }

  cancelar(id: number): Observable<RespuestaCurso> {
    return this.http.delete<RespuestaCurso>(obtenerUrlApi(`cursos/${id}`));
  }
}
