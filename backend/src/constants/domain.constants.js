export const USER_STATUS = Object.freeze({
  ACTIVE: 'activo',
  BLOCKED: 'bloqueado',
  INACTIVE: 'inactivo'
});

export const ACADEMIC_STATUS = Object.freeze({
  ACTIVE: 'activo',
  INACTIVE: 'inactivo',
  SUSPENDED: 'suspendido',
  GRADUATED: 'egresado'
});

export const ACADEMIC_PERIOD_STATUS = Object.freeze({
  PLANNED: 'planificado',
  ENROLLMENT_OPEN: 'matricula_abierta',
  IN_PROGRESS: 'en_curso',
  CLOSED: 'cerrado'
});

export const COURSE_STATUS = Object.freeze({
  OPEN: 'abierto',
  CLOSED: 'cerrado',
  CANCELLED: 'cancelado'
});

export const ENROLLMENT_STATUS = Object.freeze({
  ENROLLED: 'inscrita',
  PASSED: 'aprobada',
  FAILED: 'reprobada',
  WITHDRAWN: 'retirada',
  CANCELLED: 'anulada'
});

export const ESTADOS_MATRICULA_OCUPAN_CUPO = Object.freeze([
  ENROLLMENT_STATUS.ENROLLED,
  ENROLLMENT_STATUS.PASSED,
  ENROLLMENT_STATUS.FAILED
]);

export const ROLE_CODES = Object.freeze({
  ADMIN: 'ADMIN',
  ENROLLMENT_MANAGER: 'GESTOR_MATRICULA',
  STUDENT: 'ESTUDIANTE',
  TEACHER: 'DOCENTE'
});

export const EDAD_MINIMA_ESTUDIANTE = 15;

export const EDAD_MINIMA_DOCENTE = 22;

export const IDENTIFICACION_PATTERN = /^(?=.*\d)[A-Za-z0-9-]{5,20}$/;

export const TELEFONO_PATTERN = /^(?=.*\d)\+?[0-9\s()-]{7,20}$/;

export const NOMBRES_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;

export const CODIGO_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;

export const CREDITOS_MIN = 1;
export const CREDITOS_MAX = 12;

export const NIVEL_ACADEMICO_MIN = 1;
export const NIVEL_ACADEMICO_MAX = 12;

export const DURACION_SEMESTRES_MIN = 1;
export const DURACION_SEMESTRES_MAX = 12;

export const CUPO_MAXIMO_MIN = 1;
export const CUPO_MAXIMO_MAX = 100;
