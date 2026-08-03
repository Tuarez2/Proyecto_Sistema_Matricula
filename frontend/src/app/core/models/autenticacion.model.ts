import type { RespuestaApi } from './respuesta-api.model';

export interface CredencialesInicioSesion {
  correo: string;
  password: string;
}

export interface SolicitudRenovacionSesion {
  refreshToken: string;
}

export interface RolAutenticado {
  id: number;
  codigo: string;
  nombre: string;
}

export interface UsuarioAutenticado {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: string;
  debe_cambiar_password: boolean;
  rol: RolAutenticado | null;
}

export interface TokensSesion {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface DatosAutenticacion {
  user: UsuarioAutenticado;
  tokens: TokensSesion;
}

export interface DatosPerfilAutenticado {
  user: UsuarioAutenticado;
}

export type RespuestaInicioSesion = RespuestaApi<DatosAutenticacion>;
export type RespuestaRenovacionSesion = RespuestaApi<DatosAutenticacion>;
export type RespuestaPerfilAutenticado = RespuestaApi<DatosPerfilAutenticado>;
export type RespuestaCierreSesion = RespuestaApi<never>;
