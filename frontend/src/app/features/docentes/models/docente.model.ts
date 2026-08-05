import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export interface CursoDocente {
  id: number;
  periodo_id: number;
  asignatura_id: number;
  docente_id: number;
  paralelo: string;
  aula: string;
  horario: string;
  cupo_maximo: number;
  estado: string;
}

export interface Docente {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  especialidad: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  cursos?: CursoDocente[];
}

export interface SolicitudCrearDocente {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string | null;
  especialidad: string;
  activo?: boolean;
}

export type SolicitudActualizarDocente = Partial<SolicitudCrearDocente>;

export interface FiltrosDocentes {
  identificacion?: string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  especialidad?: string;
  activo?: boolean;
  pagina?: number;
  limite?: number;
}

export interface PaginacionDocentes {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type RespuestaListadoDocentes =
  RespuestaApi<Docente[]> & PaginacionDocentes;

export type RespuestaDocente = RespuestaApi<Docente>;

export type RespuestaCambioEstadoDocente = RespuestaDocente;
