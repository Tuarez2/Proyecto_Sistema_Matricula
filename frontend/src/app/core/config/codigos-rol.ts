export const CODIGOS_ROL = {
  ADMIN: 'ADMIN',
  GESTOR_MATRICULA: 'GESTOR_MATRICULA',
  ESTUDIANTE: 'ESTUDIANTE',
  DOCENTE: 'DOCENTE',
} as const;

export type CodigoRol = (typeof CODIGOS_ROL)[keyof typeof CODIGOS_ROL];

export const CLAVE_ROLES_PERMITIDOS = 'rolesPermitidos';
