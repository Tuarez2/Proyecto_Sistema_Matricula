import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type EstadoAcademicoEstudiante,
  type Estudiante,
  type FiltrosEstudiantes,
  type RespuestaEstudiante,
  type RespuestaListadoEstudiantes,
  type SolicitudActualizarEstudiante,
  type SolicitudCrearEstudiante,
} from '../models/estudiante.model';

interface FiltrosCompatibilidadEstudiantes extends FiltrosEstudiantes {
  estado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EstudiantesService {
  private readonly http = inject(HttpClient);

  listarEstudiantes(): Observable<RespuestaListadoEstudiantes> {
    return this.http.get<RespuestaListadoEstudiantes>(
      obtenerUrlApi('estudiantes'),
    );
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
      obtenerUrlApi('estudiantes'),
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

  getEstudiantes(
    filtros: FiltrosCompatibilidadEstudiantes = {},
  ): Observable<Estudiante[]> {
    return this.listarEstudiantes().pipe(
      map((respuesta) =>
        this.filtrarEstudiantes(respuesta.data ?? [], filtros),
      ),
    );
  }

  getEstudianteById(idEstudiante: number): Observable<Estudiante> {
    return this.obtenerEstudiante(idEstudiante).pipe(
      map((respuesta) => {
        if (!respuesta.data) {
          throw new Error('La respuesta no contiene estudiante.');
        }

        return respuesta.data;
      }),
    );
  }

  eliminarEstudiante(idEstudiante: number): Observable<RespuestaEstudiante> {
    return this.cambiarEstadoEstudiante(idEstudiante);
  }

  private filtrarEstudiantes(
    estudiantes: Estudiante[],
    filtros: FiltrosCompatibilidadEstudiantes,
  ): Estudiante[] {
    const busqueda = filtros.busqueda?.trim().toLowerCase();
    const estadoAcademico = this.normalizarEstadoAcademico(
      filtros.estadoAcademico ?? filtros.estado,
    );
    let resultado = estudiantes;

    if (busqueda) {
      resultado = resultado.filter((estudiante) =>
        [
          estudiante.numero_matricula,
          estudiante.identificacion,
          estudiante.nombres,
          estudiante.apellidos,
          estudiante.correo,
        ]
          .join(' ')
          .toLowerCase()
          .includes(busqueda),
      );
    }

    if (filtros.carreraId) {
      resultado = resultado.filter(
        (estudiante) => estudiante.carrera_id === filtros.carreraId,
      );
    }

    if (estadoAcademico) {
      resultado = resultado.filter(
        (estudiante) => estudiante.estado_academico === estadoAcademico,
      );
    }

    return resultado;
  }

  private normalizarEstadoAcademico(
    estado: string | undefined,
  ): EstadoAcademicoEstudiante | null {
    if (!estado) {
      return null;
    }

    const estadoNormalizado = estado.toLowerCase();

    if (this.esEstadoAcademico(estadoNormalizado)) {
      return estadoNormalizado;
    }

    return null;
  }

  private esEstadoAcademico(
    estado: string,
  ): estado is EstadoAcademicoEstudiante {
    return Object.values(ESTADOS_ACADEMICOS_ESTUDIANTE).some(
      (estadoPermitido) => estadoPermitido === estado,
    );
  }
}
