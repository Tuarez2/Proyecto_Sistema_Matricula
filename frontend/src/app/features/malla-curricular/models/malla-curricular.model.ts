import type { RespuestaApi } from '../../../core/models/respuesta-api.model'; import type { Asignatura } from '../../asignaturas/models/asignatura.model'; import type { Carrera } from '../../carreras/models/carrera.model';
export interface AsignacionCurricular { carrera_id:number; asignatura_id:number; carrera?:Carrera; asignatura?:Asignatura; }
export interface RespuestaListadoMalla extends RespuestaApi<AsignacionCurricular[]> { page:number; limit:number; total:number; totalPages:number; }
export interface RespuestaAsignaturasCarrera extends RespuestaListadoMalla { carrera: Carrera; }
