import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export const ESTADOS_USUARIO = {
  ACTIVO: 'activo',
  BLOQUEADO: 'bloqueado',
  INACTIVO: 'inactivo',
} as const;

export type EstadoUsuario =
  (typeof ESTADOS_USUARIO)[keyof typeof ESTADOS_USUARIO];

export interface RolUsuario {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface EstudianteUsuario {
  id: number;
  numero_matricula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estado_academico: string;
}

export interface DocenteUsuario {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: EstadoUsuario;
  rol_id: number;
  estudiante_id: number | null;
  docente_id: number | null;
  debe_cambiar_password: boolean;
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
  rol: RolUsuario | null;
  estudiante: EstudianteUsuario | null;
  docente: DocenteUsuario | null;
}

export interface FiltrosListadoUsuarios {
  correo?: string;
  estado?: EstadoUsuario;
  codigoRol?: string;
  pagina?: number;
  limite?: number;
}

export interface CrearUsuarioSolicitud {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  estado: EstadoUsuario;
  rol_id: number;
  estudiante_id: number | null;
  docente_id: number | null;
  debe_cambiar_password: boolean;
}

export interface RespuestaListadoUsuarios extends RespuestaApi<Usuario[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type RespuestaUsuario = RespuestaApi<Usuario>;
