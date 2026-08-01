import { body } from 'express-validator';

import { validateAllowedFields, validateIdParam } from './common.validator.js';

const allowedFields = ['identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'especialidad', 'activo'];

const rules = [
  body('identificacion').optional().isLength({ min: 1, max: 20 }).withMessage('La identificacion es invalida.'),
  body('nombres').optional().isLength({ min: 1, max: 100 }).withMessage('Los nombres son invalidos.'),
  body('apellidos').optional().isLength({ min: 1, max: 100 }).withMessage('Los apellidos son invalidos.'),
  body('correo').optional().isEmail().withMessage('El correo debe tener un formato valido.').isLength({ max: 150 }),
  body('telefono').optional({ nullable: true }).isLength({ max: 20 }).withMessage('El telefono es invalido.'),
  body('especialidad').optional().isLength({ min: 1, max: 150 }).withMessage('La especialidad es invalida.'),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano.').toBoolean()
];

export const validateCreateDocente = [
  validateAllowedFields(allowedFields),
  body('identificacion').exists().withMessage('La identificacion es obligatoria.'),
  body('nombres').exists().withMessage('Los nombres son obligatorios.'),
  body('apellidos').exists().withMessage('Los apellidos son obligatorios.'),
  body('correo').exists().withMessage('El correo es obligatorio.'),
  body('especialidad').exists().withMessage('La especialidad es obligatoria.'),
  ...rules
];

export const validateUpdateDocente = [validateAllowedFields(allowedFields, { requireAtLeastOne: true }), ...rules];

export { validateIdParam };

export default {
  validateCreateDocente,
  validateUpdateDocente,
  validateIdParam
};
