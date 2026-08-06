import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export const ESTADOS_MATRICULA = {
  inscrita: 'inscrita',
  aprobada: 'aprobada',
  reprobada: 'reprobada',
  retirada: 'retirada',
  anulada: 'anulada',
} as const;

export type EstadoMatricula =
  (typeof ESTADOS_MATRICULA)[keyof typeof ESTADOS_MATRICULA];

export interface CarreraMatricula {
  id: number;
  codigo: string;
  nombre: string;
  duracion_semestres: number;
  facultad_id: number;
  activo: boolean;
}

export interface EstudianteMatricula {
  id: number;
  numero_matricula: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  correo: string;
  estado_academico: string;
  nivel_academico_actual: number;
  carrera_id: number;
  carrera?: CarreraMatricula;
}

export interface AsignaturaMatricula {
  id: number;
  codigo: string;
  nombre: string;
  creditos: number;
  nivel_academico: number;
  activo: boolean;
}

export interface DocenteMatricula {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  especialidad: string;
  activo: boolean;
}

export interface PeriodoAcademicoMatricula {
  id: number;
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_inicio_matricula: string;
  fecha_fin_matricula: string;
  estado: string;
}

export interface CursoMatricula {
  id: number;
  periodo_id: number;
  asignatura_id: number;
  docente_id: number;
  paralelo: string;
  aula: string;
  horario: string;
  cupo_maximo: number;
  estado: string;
  asignatura?: AsignaturaMatricula;
  docente?: DocenteMatricula;
  periodoAcademico?: PeriodoAcademicoMatricula;
}

export interface Matricula {
  id: number;
  estudiante_id: number;
  curso_id: number;
  fecha_matricula: string;
  estado: EstadoMatricula;
  calificacion_final: string | number | null;
  created_at?: string;
  updated_at?: string;
  estudiante?: EstudianteMatricula;
  curso?: CursoMatricula;
}

export interface SolicitudCrearMatricula {
  estudiante_id: number;
  curso_id: number;
}

export interface SolicitudCrearMatriculasLote {
  estudiante_id: number;
  curso_ids: number[];
}

export interface CursoDisponibleMatricula {
  id: number;
  periodo_id: number;
  asignatura_id: number;
  docente_id: number;
  paralelo: string;
  aula: string;
  horario: string;
  cupo_maximo: number;
  estado: string;
  cantidad_matriculados: number;
  cupos_disponibles: number;
  disponible: boolean;
  asignatura?: AsignaturaMatricula;
  docente?: DocenteMatricula;
  periodoAcademico?: PeriodoAcademicoMatricula;
}

export interface RespuestaCursosDisponiblesEstudiante {
  estudiante_id: number;
  periodo: Pick<
    PeriodoAcademicoMatricula,
    'id' | 'codigo' | 'nombre' | 'estado'
  >;
  cursos: CursoDisponibleMatricula[];
}

export interface ResultadoLoteMatriculas {
  estudiante: EstudianteMatricula;
  periodo: PeriodoAcademicoMatricula;
  matriculas: Matricula[];
  total_cursos: number;
}

export interface ResumenMatriculas {
  periodo_actual: PeriodoAcademicoMatricula | null;
  ventana_matricula_abierta: boolean;
  matriculas_registradas_hoy: number;
  estudiantes_matriculados_periodo: number;
  cursos_con_pocos_cupos: CursoMatricula[];
  cursos_llenos: CursoMatricula[];
  ultimas_matriculas: Matricula[];
}

export interface RespuestaCursosDisponibles
  extends RespuestaApi<RespuestaCursosDisponiblesEstudiante> {}

export type RespuestaLoteMatriculas = RespuestaApi<ResultadoLoteMatriculas>;
export type RespuestaResumenMatriculas = RespuestaApi<ResumenMatriculas>;

export interface SolicitudCambiarEstadoMatricula {
  estado: EstadoMatricula;
}

export interface FiltrosMatriculas {
  estudiante_id?: number;
  curso_id?: number;
  estado?: EstadoMatricula;
  periodo_id?: number;
  asignatura_id?: number;
  carrera_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface PaginacionMatriculas {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespuestaListadoMatriculas
  extends RespuestaApi<Matricula[]>, PaginacionMatriculas {}

export type RespuestaMatricula = RespuestaApi<Matricula>;
export type RespuestaCambioEstadoMatricula = RespuestaMatricula;
