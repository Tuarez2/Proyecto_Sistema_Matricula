export interface RespuestaApi<T> {
  success: true;
  message?: string;
  data?: T;
}

export interface ErrorApi {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

export interface DetalleErrorApi {
  field?: string;
  message?: string;
}
