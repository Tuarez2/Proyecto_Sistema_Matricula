import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export const ESTADOS_PERIODO_ACADEMICO = {
  PLANIFICADO: 'planificado',
  MATRICULA_ABIERTA: 'matricula_abierta',
  EN_CURSO: 'en_curso',
  CERRADO: 'cerrado',
} as const;

export type EstadoPeriodoAcademico =
  (typeof ESTADOS_PERIODO_ACADEMICO)[keyof typeof ESTADOS_PERIODO_ACADEMICO];

export interface PeriodoAcademico {
  id: number;
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_inicio_matricula: string;
  fecha_fin_matricula: string;
  estado: EstadoPeriodoAcademico;
  created_at: string;
  updated_at: string;
}

export interface FiltrosListadoPeriodos {
  codigo?: string;
  nombre?: string;
  estado?: EstadoPeriodoAcademico;
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  pagina?: number;
  limite?: number;
}

export interface CrearPeriodoAcademicoSolicitud {
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_inicio_matricula: string;
  fecha_fin_matricula: string;
}

export interface ActualizarPeriodoAcademicoSolicitud {
  codigo?: string;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_inicio_matricula?: string;
  fecha_fin_matricula?: string;
}

export interface RespuestaListadoPeriodos
  extends RespuestaApi<PeriodoAcademico[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type RespuestaPeriodoAcademico = RespuestaApi<PeriodoAcademico>;
