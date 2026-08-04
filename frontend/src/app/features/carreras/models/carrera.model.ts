import type { RespuestaApi } from '../../../core/models/respuesta-api.model';
export interface Carrera { id: number; codigo: string; nombre: string; duracion_semestres: number; facultad_id: number; activo: boolean; facultad?: { id: number; nombre: string }; }
export interface SolicitudCarrera { codigo: string; nombre: string; duracion_semestres: number; facultad_id: number; activo?: boolean; }
export type RespuestaCarreras = RespuestaApi<Carrera[]>;
export type RespuestaCarrera = RespuestaApi<Carrera>;
