import { body } from 'express-validator';

import { validateAllowedFields, validateIdParam } from './common.validator.js';

const allowedFields = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];

const rules = [
  body('codigo').optional().isLength({ min: 1, max: 20 }).withMessage('El codigo es invalido.'),
  body('nombre').optional().isLength({ min: 1, max: 150 }).withMessage('El nombre es invalido.'),
  body('creditos').optional().isInt({ min: 1 }).withMessage('Los creditos deben ser positivos.').toInt(),
  body('nivel_academico').optional().isInt({ min: 1 }).withMessage('El nivel academico debe ser positivo.').toInt(),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano.').toBoolean()
];

export const validateCreateAsignatura = [
  validateAllowedFields(allowedFields),
  body('codigo').exists().withMessage('El codigo es obligatorio.'),
  body('nombre').exists().withMessage('El nombre es obligatorio.'),
  body('creditos').exists().withMessage('Los creditos son obligatorios.'),
  body('nivel_academico').exists().withMessage('El nivel academico es obligatorio.'),
  ...rules
];

export const validateUpdateAsignatura = [validateAllowedFields(allowedFields, { requireAtLeastOne: true }), ...rules];

export { validateIdParam };

export default {
  validateCreateAsignatura,
  validateUpdateAsignatura,
  validateIdParam
};
