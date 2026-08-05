import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export interface CarreraAsignaturaResumen {
  id: number;
  codigo?: string;
  nombre: string;
  activo?: boolean;
}

export interface CursoAsignaturaResumen {
  id: number;
  paralelo?: string;
  aula?: string;
  horario?: string;
  estado?: string;
  cupo_maximo?: number;
}

export interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  creditos: number;
  nivel_academico: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  carreras?: CarreraAsignaturaResumen[];
  cursos?: CursoAsignaturaResumen[];
}

export interface SolicitudCrearAsignatura {
  codigo: string;
  nombre: string;
  creditos: number;
  nivel_academico: number;
  activo?: boolean;
}

export interface SolicitudActualizarAsignatura {
  codigo?: string;
  nombre?: string;
  creditos?: number;
  nivel_academico?: number;
  activo?: boolean;
}

export interface FiltrosAsignaturas {
  codigo?: string;
  nombre?: string;
  creditos?: number;
  nivel_academico?: number;
  activo?: boolean;
  pagina?: number;
  limite?: number;
}

export interface PaginacionAsignaturas {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type RespuestaListadoAsignaturas =
  RespuestaApi<Asignatura[]> & PaginacionAsignaturas;
export type RespuestaAsignatura = RespuestaApi<Asignatura>;
export type RespuestaCambioEstadoAsignatura = RespuestaAsignatura;
