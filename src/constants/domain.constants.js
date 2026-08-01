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
