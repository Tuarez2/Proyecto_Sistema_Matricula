import { body, query } from 'express-validator';

import { validarCamposPermitidos, validarFiltrosPermitidos, validarIdParam } from './common.validator.js';

const camposPermitidos = ['codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];
const camposListado = ['codigo', 'nombre', 'facultad_id', 'activo', 'page', 'limit'];

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

export const validarListadoCarreras = [
  validarFiltrosPermitidos(camposListado),
  query('codigo')
    .optional()
    .isString()
    .withMessage('El filtro codigo debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('El filtro codigo tiene una longitud invalida.'),
  query('nombre')
    .optional()
    .isString()
    .withMessage('El filtro nombre debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('El filtro nombre tiene una longitud invalida.'),
  query('facultad_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El filtro facultad debe ser un entero positivo.')
    .toInt(),
  query('activo').optional().isBoolean().withMessage('El filtro activo debe ser booleano.').toBoolean(),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export { validarIdParam };

export default {
  validarCreacionCarrera,
  validarActualizacionCarrera,
  validarListadoCarreras,
  validarIdParam
};
