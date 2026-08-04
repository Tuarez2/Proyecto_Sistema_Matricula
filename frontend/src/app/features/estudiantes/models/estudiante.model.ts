export interface Estudiante {
  id?: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  carrera: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface FiltrosEstudiante {
  busqueda?: string;
  carrera?: string;
  estado?: string;
}