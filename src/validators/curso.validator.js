import { body } from 'express-validator';

import { COURSE_STATUS } from '../constants/domain.constants.js';
import { validateAllowedFields, validateIdParam } from './common.validator.js';

const allowedFields = [
  'periodo_id',
  'asignatura_id',
  'docente_id',
  'paralelo',
  'aula',
  'horario',
  'cupo_maximo',
  'estado'
];

const rules = [
  body('periodo_id').optional().isInt({ min: 1 }).withMessage('El periodo academico debe ser valido.').toInt(),
  body('asignatura_id').optional().isInt({ min: 1 }).withMessage('La asignatura debe ser valida.').toInt(),
  body('docente_id').optional().isInt({ min: 1 }).withMessage('El docente debe ser valido.').toInt(),
  body('paralelo').optional().isLength({ min: 1, max: 10 }).withMessage('El paralelo es invalido.'),
  body('aula').optional().isLength({ min: 1, max: 50 }).withMessage('El aula es invalida.'),
  body('horario').optional().isLength({ min: 1, max: 150 }).withMessage('El horario es invalido.'),
  body('cupo_maximo').optional().isInt({ min: 1 }).withMessage('El cupo maximo debe ser positivo.').toInt(),
  body('estado').optional().isIn(Object.values(COURSE_STATUS)).withMessage('El estado del curso no es valido.')
];

export const validateCreateCurso = [
  validateAllowedFields(allowedFields),
  body('periodo_id').exists().withMessage('El periodo academico es obligatorio.'),
  body('asignatura_id').exists().withMessage('La asignatura es obligatoria.'),
  body('docente_id').exists().withMessage('El docente es obligatorio.'),
  body('paralelo').exists().withMessage('El paralelo es obligatorio.'),
  body('aula').exists().withMessage('El aula es obligatoria.'),
  body('horario').exists().withMessage('El horario es obligatorio.'),
  body('cupo_maximo').exists().withMessage('El cupo maximo es obligatorio.'),
  ...rules
];

export const validateUpdateCurso = [validateAllowedFields(allowedFields, { requireAtLeastOne: true }), ...rules];

export { validateIdParam };

export default {
  validateCreateCurso,
  validateUpdateCurso,
  validateIdParam
};
