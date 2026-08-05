import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export const ESTADOS_CURSO = {
  ABIERTO: 'abierto',
  CERRADO: 'cerrado',
  CANCELADO: 'cancelado'
} as const;

export type EstadoCurso = (typeof ESTADOS_CURSO)[keyof typeof ESTADOS_CURSO];

export interface ReferenciaPeriodoCurso {
  id: number;
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_inicio_matricula: string;
  fecha_fin_matricula: string;
  estado: string;
}

export interface ReferenciaAsignaturaCurso {
  id: number;
  codigo: string;
  nombre: string;
  creditos: number;
  nivel_academico: number;
  activo: boolean;
}

export interface ReferenciaDocenteCurso {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  especialidad: string;
  activo: boolean;
}

export interface Curso {
  id: number;
  periodo_id: number;
  asignatura_id: number;
  docente_id: number;
  paralelo: string;
  aula: string;
  horario: string;
  cupo_maximo: number;
  estado: EstadoCurso;
  created_at?: string;
  updated_at?: string;
  cantidad_matriculados?: number;
  cupos_disponibles?: number;
  periodoAcademico?: ReferenciaPeriodoCurso;
  asignatura?: ReferenciaAsignaturaCurso;
  docente?: ReferenciaDocenteCurso;
}

export interface SolicitudCurso {
  periodo_id: number;
  asignatura_id: number;
  docente_id: number;
  paralelo: string;
  aula: string;
  horario: string;
  cupo_maximo: number;
  estado?: EstadoCurso;
}

export interface InformacionPaginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespuestaListadoCursos extends RespuestaApi<Curso[]>, InformacionPaginacion {}

export type RespuestaCurso = RespuestaApi<Curso>;
