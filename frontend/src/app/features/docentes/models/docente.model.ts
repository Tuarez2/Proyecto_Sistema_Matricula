export interface Docente {
  id?: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  titulo: string; // ej: Magíster en Ciencias de la Computación, Doctor, Ing.
  especialidad: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface FiltrosDocente {
  busqueda?: string;
  especialidad?: string;
  estado?: string;
}