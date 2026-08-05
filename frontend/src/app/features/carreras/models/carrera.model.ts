import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export interface FacultadCarrera {
  id: number;
  codigo?: string;
  nombre: string;
  activo?: boolean;
}

export interface AsignaturaCarrera {
  id: number;
  codigo: string;
  nombre: string;
  creditos?: number;
  nivel_academico?: number;
  activo: boolean;
}

export interface EstudianteCarrera {
  id: number;
  identificacion?: string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  estado_academico?: string;
  activo?: boolean;
}

export interface Carrera {
  id: number;
  codigo: string;
  nombre: string;
  duracion_semestres: number;
  facultad_id: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  facultad?: FacultadCarrera | null;
  asignaturas?: AsignaturaCarrera[];
  estudiantes?: EstudianteCarrera[];
}

export interface SolicitudCrearCarrera {
  codigo: string;
  nombre: string;
  duracion_semestres: number;
  facultad_id: number;
  activo?: boolean;
}

export interface SolicitudActualizarCarrera {
  codigo?: string;
  nombre?: string;
  duracion_semestres?: number;
  facultad_id?: number;
  activo?: boolean;
}

export interface SolicitudCambiarEstadoCarrera {
  activo: boolean;
}

export interface FiltrosCarreras {
  codigo?: string;
  nombre?: string;
  facultad_id?: number;
  activo?: boolean;
  pagina?: number;
  limite?: number;
}

export interface PaginacionCarreras {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespuestaListadoCarreras
  extends RespuestaApi<Carrera[]>, PaginacionCarreras {}

export type RespuestaCarreras = RespuestaListadoCarreras;
export type RespuestaCarrera = RespuestaApi<Carrera>;
export type RespuestaCambioEstadoCarrera = RespuestaCarrera;
