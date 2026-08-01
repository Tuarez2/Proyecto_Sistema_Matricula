import { body } from 'express-validator';

import { validarCamposPermitidos, validarIdParam } from './common.validator.js';

const camposPermitidos = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];

const reglas = [
  body('codigo').optional().isLength({ min: 1, max: 20 }).withMessage('El codigo es invalido.'),
  body('nombre').optional().isLength({ min: 1, max: 150 }).withMessage('El nombre es invalido.'),
  body('creditos').optional().isInt({ min: 1 }).withMessage('Los creditos deben ser positivos.').toInt(),
  body('nivel_academico').optional().isInt({ min: 1 }).withMessage('El nivel academico debe ser positivo.').toInt(),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano.').toBoolean()
];

export const validarCreacionAsignatura = [
  validarCamposPermitidos(camposPermitidos),
  body('codigo').exists().withMessage('El codigo es obligatorio.'),
  body('nombre').exists().withMessage('El nombre es obligatorio.'),
  body('creditos').exists().withMessage('Los creditos son obligatorios.'),
  body('nivel_academico').exists().withMessage('El nivel academico es obligatorio.'),
  ...reglas
];

export const validarActualizacionAsignatura = [validarCamposPermitidos(camposPermitidos, { requireAtLeastOne: true }), ...reglas];

export { validarIdParam };

export default {
  validarCreacionAsignatura,
  validarActualizacionAsignatura,
  validarIdParam
};
