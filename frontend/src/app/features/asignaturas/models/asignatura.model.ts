import type { RespuestaApi } from '../../../core/models/respuesta-api.model';
export interface Asignatura { id: number; codigo: string; nombre: string; creditos: number; nivel_academico: number; activo: boolean; }
export interface SolicitudAsignatura { codigo: string; nombre: string; creditos: number; nivel_academico: number; activo?: boolean; }
export type RespuestaAsignaturas = RespuestaApi<Asignatura[]>; export type RespuestaAsignatura = RespuestaApi<Asignatura>;
