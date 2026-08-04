import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export interface Facultad { id: number; codigo: string; nombre: string; activo: boolean; }
export interface FiltrosFacultades { codigo?: string; nombre?: string; activo?: boolean; pagina?: number; limite?: number; }
export interface SolicitudFacultad { codigo: string; nombre: string; activo?: boolean; }
export interface RespuestaListadoFacultades extends RespuestaApi<Facultad[]> { page: number; limit: number; total: number; totalPages: number; }
export type RespuestaFacultad = RespuestaApi<Facultad>;
