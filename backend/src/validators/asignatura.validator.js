import { body, query } from 'express-validator';

import { CREDITOS_MAX, CREDITOS_MIN, NIVEL_ACADEMICO_MAX, NIVEL_ACADEMICO_MIN } from '../constants/domain.constants.js';
import { validarCamposPermitidos, validarFiltrosPermitidos, validarIdParam } from './common.validator.js';
import { reglaCodigoOpcional, reglaTextoOpcional } from './reglasComunes.js';

const camposPermitidos = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];
const camposListado = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo', 'page', 'limit'];

const reglas = [
  reglaCodigoOpcional('codigo', 'El codigo'),
  reglaTextoOpcional('nombre', 'El nombre', { max: 150 }),
  body('creditos')
    .optional()
    .isInt({ min: CREDITOS_MIN, max: CREDITOS_MAX })
    .withMessage(`Los creditos deben estar entre ${CREDITOS_MIN} y ${CREDITOS_MAX}.`)
    .toInt(),
  body('nivel_academico')
    .optional()
    .isInt({ min: NIVEL_ACADEMICO_MIN, max: NIVEL_ACADEMICO_MAX })
    .withMessage(`El nivel academico debe estar entre ${NIVEL_ACADEMICO_MIN} y ${NIVEL_ACADEMICO_MAX}.`)
    .toInt(),
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

export const validarListadoAsignaturas = [
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
  query('creditos')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El filtro creditos debe ser un entero positivo.')
    .toInt(),
  query('nivel_academico')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El filtro nivel academico debe ser un entero positivo.')
    .toInt(),
  query('activo').optional().isBoolean().withMessage('El filtro activo debe ser booleano.').toBoolean(),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export { validarIdParam };

export default {
  validarCreacionAsignatura,
  validarActualizacionAsignatura,
  validarListadoAsignaturas,
  validarIdParam
};
