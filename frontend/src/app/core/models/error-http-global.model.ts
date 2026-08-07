export type TipoErrorHttpGlobal =
  | 'SESION_NO_AUTORIZADA'
  | 'ACCESO_PROHIBIDO'
  | 'DEMASIADAS_SOLICITUDES';

export interface ErrorHttpGlobal {
  tipo: TipoErrorHttpGlobal;
  estadoHttp: 401 | 403 | 429;
  mensaje: string;
  codigo: string | null;
  detalles: unknown;
  reintentarDespuesSegundos: number | null;
  marcaTiempo: number;
}
