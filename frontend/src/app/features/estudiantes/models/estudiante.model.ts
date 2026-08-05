import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export const ESTADOS_ACADEMICOS_ESTUDIANTE = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  SUSPENDIDO: 'suspendido',
  EGRESADO: 'egresado',
} as const;

export type EstadoAcademicoEstudiante =
  (typeof ESTADOS_ACADEMICOS_ESTUDIANTE)[keyof typeof ESTADOS_ACADEMICOS_ESTUDIANTE];

export interface CarreraEstudiante {
  id: number;
  codigo: string;
  nombre: string;
  duracion_semestres: number;
  facultad_id: number;
  activo: boolean;
}

export interface CursoMatriculadoEstudiante {
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

export interface Estudiante {
  id: number;
  carrera_id: number;
  numero_matricula: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  fecha_nacimiento: string;
  estado_academico: EstadoAcademicoEstudiante;
  nivel_academico_actual: number;
  created_at?: string;
  updated_at?: string;
  carrera?: CarreraEstudiante;
  cursosMatriculados?: CursoMatriculadoEstudiante[];
}

export interface SolicitudCrearEstudiante {
  carrera_id: number;
  numero_matricula: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string | null;
  fecha_nacimiento: string;
  estado_academico?: EstadoAcademicoEstudiante;
  nivel_academico_actual: number;
}

export type SolicitudActualizarEstudiante =
  Partial<SolicitudCrearEstudiante>;

export interface FiltrosEstudiantes {
  busqueda?: string;
  carreraId?: number;
  estadoAcademico?: EstadoAcademicoEstudiante;
  pagina?: number;
  limite?: number;
}

export interface PaginacionEstudiantes {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export type RespuestaListadoEstudiantes = RespuestaApi<Estudiante[]>;

export type RespuestaEstudiante = RespuestaApi<Estudiante>;
