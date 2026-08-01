import { body } from 'express-validator';

import { validateAllowedFields, validateIdParam } from './common.validator.js';

const allowedFields = ['codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];

const rules = [
  body('codigo').optional().isLength({ min: 1, max: 20 }).withMessage('El codigo es invalido.'),
  body('nombre').optional().isLength({ min: 1, max: 150 }).withMessage('El nombre es invalido.'),
  body('duracion_semestres')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La duracion en semestres debe ser positiva.')
    .toInt(),
  body('facultad_id').optional().isInt({ min: 1 }).withMessage('La facultad debe ser valida.').toInt(),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano.').toBoolean()
];

export const validateCreateCarrera = [
  validateAllowedFields(allowedFields),
  body('codigo').exists().withMessage('El codigo es obligatorio.'),
  body('nombre').exists().withMessage('El nombre es obligatorio.'),
  body('duracion_semestres').exists().withMessage('La duracion en semestres es obligatoria.'),
  body('facultad_id').exists().withMessage('La facultad es obligatoria.'),
  ...rules
];

export const validateUpdateCarrera = [validateAllowedFields(allowedFields, { requireAtLeastOne: true }), ...rules];

export { validateIdParam };

export default {
  validateCreateCarrera,
  validateUpdateCarrera,
  validateIdParam
};
