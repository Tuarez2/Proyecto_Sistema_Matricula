import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export const ESTADOS_PERIODO_ACADEMICO = {
  PLANIFICADO: 'planificado',
  MATRICULA_ABIERTA: 'matricula_abierta',
  EN_CURSO: 'en_curso',
  CERRADO: 'cerrado',
} as const;

export type EstadoPeriodoAcademico =
  (typeof ESTADOS_PERIODO_ACADEMICO)[keyof typeof ESTADOS_PERIODO_ACADEMICO];

export const TRANSICIONES_PERIODO_ACADEMICO: Readonly<
  Record<EstadoPeriodoAcademico, readonly EstadoPeriodoAcademico[]>
> = Object.freeze({
  [ESTADOS_PERIODO_ACADEMICO.PLANIFICADO]: Object.freeze([
    ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA,
    ESTADOS_PERIODO_ACADEMICO.CERRADO,
  ]),
  [ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA]: Object.freeze([
    ESTADOS_PERIODO_ACADEMICO.EN_CURSO,
    ESTADOS_PERIODO_ACADEMICO.CERRADO,
  ]),
  [ESTADOS_PERIODO_ACADEMICO.EN_CURSO]: Object.freeze([
    ESTADOS_PERIODO_ACADEMICO.CERRADO,
  ]),
  [ESTADOS_PERIODO_ACADEMICO.CERRADO]: Object.freeze([]),
});

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

export interface CambiarEstadoPeriodoAcademicoSolicitud {
  estado: EstadoPeriodoAcademico;
}

export interface RespuestaListadoPeriodos
  extends RespuestaApi<PeriodoAcademico[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type RespuestaPeriodoAcademico = RespuestaApi<PeriodoAcademico>;
