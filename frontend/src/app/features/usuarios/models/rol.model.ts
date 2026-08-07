import type { RespuestaApi } from '../../../core/models/respuesta-api.model';

export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export type RespuestaRoles = RespuestaApi<Rol[]>;
