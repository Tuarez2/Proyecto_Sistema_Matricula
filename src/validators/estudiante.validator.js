import { body } from 'express-validator';

import { ACADEMIC_STATUS } from '../constants/domain.constants.js';
import { validateAllowedFields, validateIdParam } from './common.validator.js';

const allowedFields = [
  'carrera_id',
  'numero_matricula',
  'identificacion',
  'nombres',
  'apellidos',
  'correo',
  'telefono',
  'fecha_nacimiento',
  'estado_academico',
  'nivel_academico_actual'
];

const rules = [
  body('carrera_id').optional().isInt({ min: 1 }).withMessage('La carrera debe ser valida.').toInt(),
  body('numero_matricula').optional().isLength({ min: 1, max: 30 }).withMessage('El numero de matricula es invalido.'),
  body('identificacion').optional().isLength({ min: 1, max: 20 }).withMessage('La identificacion es invalida.'),
  body('nombres').optional().isLength({ min: 1, max: 100 }).withMessage('Los nombres son invalidos.'),
  body('apellidos').optional().isLength({ min: 1, max: 100 }).withMessage('Los apellidos son invalidos.'),
  body('correo').optional().isEmail().withMessage('El correo debe tener un formato valido.').isLength({ max: 150 }),
  body('telefono').optional({ nullable: true }).isLength({ max: 20 }).withMessage('El telefono es invalido.'),
  body('fecha_nacimiento').optional().isISO8601().withMessage('La fecha de nacimiento debe ser valida.'),
  body('estado_academico')
    .optional()
    .isIn(Object.values(ACADEMIC_STATUS))
    .withMessage('El estado academico no es valido.'),
  body('nivel_academico_actual')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El nivel academico actual debe ser un entero positivo.')
    .toInt()
];

export const validateCreateEstudiante = [
  validateAllowedFields(allowedFields),
  body('carrera_id').exists().withMessage('La carrera es obligatoria.'),
  body('numero_matricula').exists().withMessage('El numero de matricula es obligatorio.'),
  body('identificacion').exists().withMessage('La identificacion es obligatoria.'),
  body('nombres').exists().withMessage('Los nombres son obligatorios.'),
  body('apellidos').exists().withMessage('Los apellidos son obligatorios.'),
  body('correo').exists().withMessage('El correo es obligatorio.'),
  body('fecha_nacimiento').exists().withMessage('La fecha de nacimiento es obligatoria.'),
  body('nivel_academico_actual').exists().withMessage('El nivel academico actual es obligatorio.'),
  ...rules
];

export const validateUpdateEstudiante = [validateAllowedFields(allowedFields, { requireAtLeastOne: true }), ...rules];

export { validateIdParam };

export default {
  validateCreateEstudiante,
  validateUpdateEstudiante,
  validateIdParam
};
