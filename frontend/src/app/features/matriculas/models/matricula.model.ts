export interface DetalleMatricula {
  cursoId: number;
  nombreCurso?: string;
  codigoCurso?: string;
  creditos?: number;
}

export interface Matricula {
  id?: number;
  estudianteId: number;
  estudianteNombre?: string;
  estudianteCedula?: string;
  periodoLectivo: string; // Ej: "2026-1"
  fechaMatricula?: string;
  estado: 'REGISTRADA' | 'ANULADA' | 'FINALIZADA';
  detalles: DetalleMatricula[];
}

export interface FiltrosMatricula {
  estudianteId?: number;
  periodoLectivo?: string;
  estado?: string;
}

// Respuesta de error o conflicto desde el backend
export interface ErrorMatriculaResponse {
  codigo: 'PERIODO_CERRADO' | 'SIN_CUPO' | 'MATRICULA_DUPLICADA' | 'ESTUDIANTE_INHABILITADO' | 'FORA_DE_MALLA' | 'GENERAL';
  mensaje: string;
  detallesConflictos?: string[];
}
