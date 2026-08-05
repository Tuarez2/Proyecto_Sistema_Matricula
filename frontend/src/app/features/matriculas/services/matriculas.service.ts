import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Matricula, FiltrosMatricula } from '../models/matricula.model';

@Injectable({
  providedIn: 'root'
})
export class MatriculasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/matriculas';

  getMatriculas(filtros?: FiltrosMatricula): Observable<Matricula[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.estudianteId) params = params.set('estudianteId', filtros.estudianteId.toString());
      if (filtros.periodoLectivo) params = params.set('periodoLectivo', filtros.periodoLectivo);
      if (filtros.estado) params = params.set('estado', filtros.estado);
    }
    return this.http.get<Matricula[]>(this.apiUrl, { params });
  }

  getMatriculaById(id: number): Observable<Matricula> {
    return this.http.get<Matricula>(`${this.apiUrl}/${id}`);
  }

  crearMatricula(matricula: Matricula): Observable<Matricula> {
    return this.http.post<Matricula>(this.apiUrl, matricula);
  }

  cambiarEstado(id: number, estado: 'REGISTRADA' | 'ANULADA' | 'FINALIZADA'): Observable<Matricula> {
    return this.http.patch<Matricula>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}
