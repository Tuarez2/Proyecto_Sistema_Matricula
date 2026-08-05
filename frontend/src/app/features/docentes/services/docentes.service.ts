import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

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

interface FiltrosCompatibilidadDocentes extends FiltrosDocentes {
  estado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocentesService {
  private readonly http = inject(HttpClient);

  listarDocentes(): Observable<RespuestaListadoDocentes> {
    return this.http.get<RespuestaListadoDocentes>(obtenerUrlApi('docentes'));
  }

  obtenerDocente(idDocente: number): Observable<RespuestaDocente> {
    return this.http.get<RespuestaDocente>(obtenerUrlApi(`docentes/${idDocente}`));
  }

  crearDocente(solicitud: SolicitudCrearDocente): Observable<RespuestaDocente> {
    return this.http.post<RespuestaDocente>(obtenerUrlApi('docentes'), solicitud);
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

  getDocentes(
    filtros: FiltrosCompatibilidadDocentes = {},
  ): Observable<Docente[]> {
    return this.listarDocentes().pipe(
      map((respuesta) => this.filtrarDocentes(respuesta.data ?? [], filtros)),
    );
  }

  getDocenteById(idDocente: number): Observable<Docente> {
    return this.obtenerDocente(idDocente).pipe(
      map((respuesta) => {
        if (!respuesta.data) {
          throw new Error('La respuesta no contiene docente.');
        }

        return respuesta.data;
      }),
    );
  }

  eliminarDocente(idDocente: number): Observable<RespuestaCambioEstadoDocente> {
    return this.cambiarEstadoDocente(idDocente, false);
  }

  private filtrarDocentes(
    docentes: Docente[],
    filtros: FiltrosCompatibilidadDocentes,
  ): Docente[] {
    const busqueda = filtros.busqueda?.trim().toLowerCase();
    const activo = this.normalizarActivo(filtros.activo, filtros.estado);
    let resultado = docentes;

    if (busqueda) {
      resultado = resultado.filter((docente) =>
        [
          docente.identificacion,
          docente.nombres,
          docente.apellidos,
          docente.correo,
          docente.especialidad,
        ]
          .join(' ')
          .toLowerCase()
          .includes(busqueda),
      );
    }

    if (filtros.especialidad?.trim()) {
      const especialidad = filtros.especialidad.trim().toLowerCase();
      resultado = resultado.filter(
        (docente) => docente.especialidad.toLowerCase() === especialidad,
      );
    }

    if (activo !== null) {
      resultado = resultado.filter((docente) => docente.activo === activo);
    }

    return resultado;
  }

  private normalizarActivo(
    activo: boolean | undefined,
    estado: string | undefined,
  ): boolean | null {
    if (activo !== undefined) {
      return activo;
    }

    if (!estado) {
      return null;
    }

    const estadoNormalizado = estado.toLowerCase();

    if (estadoNormalizado === 'activo') {
      return true;
    }

    if (estadoNormalizado === 'inactivo') {
      return false;
    }

    return null;
  }
}
