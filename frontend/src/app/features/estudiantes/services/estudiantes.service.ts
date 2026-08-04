import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estudiante, FiltrosEstudiante } from '../models/estudiante.model';

@Injectable({
  providedIn: 'root'
})
export class EstudiantesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/estudiantes'; // Ajusta el puerto de tu API si es necesario

  /**
   * Obtiene la lista completa de estudiantes con opción de filtrado
   */
  getEstudiantes(filtros?: FiltrosEstudiante): Observable<Estudiante[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
      if (filtros.carrera) params = params.set('carrera', filtros.carrera);
      if (filtros.estado) params = params.set('estado', filtros.estado);
    }

    return this.http.get<Estudiante[]>(this.apiUrl, { params });
  }

  /**
   * Obtiene un estudiante específico por su ID
   */
  getEstudianteById(id: number): Observable<Estudiante> {
    return this.http.get<Estudiante>(`${this.apiUrl}/${id}`);
  }

  /**
   * Registra un nuevo estudiante
   */
  crearEstudiante(estudiante: Estudiante): Observable<Estudiante> {
    return this.http.post<Estudiante>(this.apiUrl, estudiante);
  }

  /**
   * Actualiza la información de un estudiante existente
   */
  actualizarEstudiante(id: number, estudiante: Estudiante): Observable<Estudiante> {
    return this.http.put<Estudiante>(`${this.apiUrl}/${id}`, estudiante);
  }

  /**
   * Elimina o inhabilita un estudiante por su ID
   */
  eliminarEstudiante(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
