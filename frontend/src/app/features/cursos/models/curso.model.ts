import type { RespuestaApi } from '../../../core/models/respuesta-api.model';
export const ESTADOS_CURSO={ABIERTO:'abierto',CERRADO:'cerrado',CANCELADO:'cancelado'} as const; export type EstadoCurso=(typeof ESTADOS_CURSO)[keyof typeof ESTADOS_CURSO];
export interface Curso {id:number;periodo_id:number;asignatura_id:number;docente_id:number;paralelo:string;aula:string;horario:string;cupo_maximo:number;estado:EstadoCurso;cupos_disponibles?:number;cantidad_matriculados?:number;periodoAcademico?:{nombre:string};asignatura?:{nombre:string};docente?:{nombres:string;apellidos:string};}
export interface SolicitudCurso {periodo_id:number;asignatura_id:number;docente_id:number;paralelo:string;aula:string;horario:string;cupo_maximo:number;estado?:EstadoCurso;}
export interface RespuestaListadoCursos extends RespuestaApi<Curso[]>{page:number;limit:number;total:number;totalPages:number;}
