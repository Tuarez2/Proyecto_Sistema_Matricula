import type { RespuestaApi } from '../../../core/models/respuesta-api.model';
import type { Asignatura } from '../../asignaturas/models/asignatura.model';
import type { Carrera } from '../../carreras/models/carrera.model';

export interface AsignacionCurricular {
  id: string;
  carrera_id: number;
  asignatura_id: number;
  created_at?: string;
  updated_at?: string;
  carrera?: Carrera;
  asignatura?: Asignatura;
}

export interface PaginacionMalla {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespuestaAsignaturasCarrera extends PaginacionMalla {
  success: true;
  carrera: Carrera;
  data?: Asignatura[];
}

export type RespuestaAsignacion = RespuestaApi<AsignacionCurricular>;

export interface SolicitudAgregarAsignatura {
  carrera_id: number;
  asignatura_id: number;
}

export interface SolicitudActualizarRelacion {
  carrera_id?: number;
  asignatura_id?: number;
}
