import { body } from 'express-validator';

import { validarCamposPermitidos, validarIdParam } from './common.validator.js';

const camposPermitidos = ['codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];

const reglas = [
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

export const validarCreacionCarrera = [
  validarCamposPermitidos(camposPermitidos),
  body('codigo').exists().withMessage('El codigo es obligatorio.'),
  body('nombre').exists().withMessage('El nombre es obligatorio.'),
  body('duracion_semestres').exists().withMessage('La duracion en semestres es obligatoria.'),
  body('facultad_id').exists().withMessage('La facultad es obligatoria.'),
  ...reglas
];

export const validarActualizacionCarrera = [validarCamposPermitidos(camposPermitidos, { requireAtLeastOne: true }), ...reglas];

export { validarIdParam };

export default {
  validarCreacionCarrera,
  validarActualizacionCarrera,
  validarIdParam
};
