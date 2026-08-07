import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export interface CarreraFacultad {
  id: number;
  codigo: string;
  nombre: string;
  duracion_semestres: number;
  activo: boolean;
}

export interface Facultad {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  carreras?: CarreraFacultad[];
}

export interface SolicitudCrearFacultad {
  codigo: string;
  nombre: string;
  activo?: boolean;
}

export interface SolicitudActualizarFacultad {
  codigo?: string;
  nombre?: string;
}

export interface SolicitudCambiarEstadoFacultad {
  activo: boolean;
}

export interface FiltrosFacultades {
  codigo?: string;
  nombre?: string;
  activo?: boolean;
  pagina?: number;
  limite?: number;
}

export interface PaginacionFacultades {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespuestaListadoFacultades
  extends RespuestaApi<Facultad[]>, PaginacionFacultades {}

export type RespuestaFacultad = RespuestaApi<Facultad>;
export type RespuestaCambioEstadoFacultad = RespuestaFacultad;
