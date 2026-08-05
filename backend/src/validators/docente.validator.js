import { body, query } from 'express-validator';

import {
  validarCamposPermitidos,
  validarFiltrosPermitidos,
  validarIdParam
} from './common.validator.js';

const camposPermitidos = ['identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'especialidad', 'activo'];

const camposListado = ['identificacion', 'nombres', 'apellidos', 'correo', 'especialidad', 'activo', 'page', 'limit'];

const reglas = [
  body('identificacion').optional().isLength({ min: 1, max: 20 }).withMessage('La identificacion es invalida.'),
  body('nombres').optional().isLength({ min: 1, max: 100 }).withMessage('Los nombres son invalidos.'),
  body('apellidos').optional().isLength({ min: 1, max: 100 }).withMessage('Los apellidos son invalidos.'),
  body('correo').optional().isEmail().withMessage('El correo debe tener un formato valido.').isLength({ max: 150 }),
  body('telefono').optional({ nullable: true }).isLength({ max: 20 }).withMessage('El telefono es invalido.'),
  body('especialidad').optional().isLength({ min: 1, max: 150 }).withMessage('La especialidad es invalida.'),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano.').toBoolean()
];

export const validarCreacionDocente = [
  validarCamposPermitidos(camposPermitidos),
  body('identificacion').exists().withMessage('La identificacion es obligatoria.'),
  body('nombres').exists().withMessage('Los nombres son obligatorios.'),
  body('apellidos').exists().withMessage('Los apellidos son obligatorios.'),
  body('correo').exists().withMessage('El correo es obligatorio.'),
  body('especialidad').exists().withMessage('La especialidad es obligatoria.'),
  ...reglas
];

export const validarActualizacionDocente = [validarCamposPermitidos(camposPermitidos, { requireAtLeastOne: true }), ...reglas];

export const validarListadoDocentes = [
  validarFiltrosPermitidos(camposListado),
  query('identificacion')
    .optional()
    .isString()
    .withMessage('El filtro identificacion debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('El filtro identificacion tiene una longitud invalida.'),
  query('nombres')
    .optional()
    .isString()
    .withMessage('El filtro nombres debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El filtro nombres tiene una longitud invalida.'),
  query('apellidos')
    .optional()
    .isString()
    .withMessage('El filtro apellidos debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El filtro apellidos tiene una longitud invalida.'),
  query('correo')
    .optional()
    .isString()
    .withMessage('El filtro correo debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('El filtro correo tiene una longitud invalida.'),
  query('especialidad')
    .optional()
    .isString()
    .withMessage('El filtro especialidad debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('El filtro especialidad tiene una longitud invalida.'),
  query('activo')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('El filtro activo debe ser un booleano valido.')
    .toBoolean(),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export { validarIdParam };

export default {
  validarCreacionDocente,
  validarActualizacionDocente,
  validarListadoDocentes,
  validarIdParam
};
