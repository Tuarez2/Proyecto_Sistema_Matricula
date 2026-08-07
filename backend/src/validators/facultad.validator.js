import { body, query } from 'express-validator';

import ApiError from '../utils/ApiError.js';
import { validarIdParam } from './common.validator.js';
import { reglaCodigoOpcional, reglaTextoOpcional } from './reglasComunes.js';

const camposCreacion = ['codigo', 'nombre', 'activo'];
const camposActualizacion = ['codigo', 'nombre'];
const camposEstado = ['activo'];
const camposListado = ['codigo', 'nombre', 'activo', 'page', 'limit'];

const validarCamposPermitidosFacultad = (camposPermitidos, opciones = {}) => (req, res, next) => {
  const cuerpoSolicitud = req.body ?? {};
  const campos = Object.keys(cuerpoSolicitud);
  const camposDesconocidos = campos.filter((campo) => !camposPermitidos.includes(campo));

  if (camposDesconocidos.length > 0) {
    return next(new ApiError(400, 'Existen campos no permitidos en la solicitud.', 'UNKNOWN_FIELDS', camposDesconocidos));
  }

  if (opciones.requireAtLeastOne && campos.length === 0) {
    return next(new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_REQUEST_BODY'));
  }

  return next();
};

const validarFiltrosPermitidos = (camposPermitidos) => (req, res, next) => {
  const campos = Object.keys(req.query ?? {});
  const camposDesconocidos = campos.filter((campo) => !camposPermitidos.includes(campo));

  if (camposDesconocidos.length > 0) {
    return next(new ApiError(400, 'Existen filtros no permitidos en la solicitud.', 'UNKNOWN_QUERY_FIELDS', camposDesconocidos));
  }

  return next();
};

const reglaCodigo = () => reglaCodigoOpcional('codigo', 'El codigo');

const reglaNombre = () => reglaTextoOpcional('nombre', 'El nombre', { max: 120 });

const reglasComunes = [
  reglaCodigo(),
  reglaNombre(),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano.').toBoolean()
];

export const validarListadoFacultades = [
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
    .isLength({ min: 1, max: 120 })
    .withMessage('El filtro nombre tiene una longitud invalida.'),
  query('activo').optional().isBoolean().withMessage('El filtro activo debe ser booleano.').toBoolean(),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export const validarCreacionFacultad = [
  validarCamposPermitidosFacultad(camposCreacion),
  body('codigo').exists().withMessage('El codigo es obligatorio.'),
  body('nombre').exists().withMessage('El nombre es obligatorio.'),
  ...reglasComunes
];

export const validarActualizacionFacultad = [
  validarCamposPermitidosFacultad(camposActualizacion, { requireAtLeastOne: true }),
  reglaCodigo(),
  reglaNombre()
];

export const validarCambioEstadoFacultad = [
  validarCamposPermitidosFacultad(camposEstado),
  body('activo')
    .exists()
    .withMessage('El estado activo es obligatorio.')
    .bail()
    .isBoolean()
    .withMessage('El campo activo debe ser booleano.')
    .toBoolean()
];

export const validarIdFacultad = validarIdParam;

export default {
  validarListadoFacultades,
  validarIdFacultad,
  validarCreacionFacultad,
  validarActualizacionFacultad,
  validarCambioEstadoFacultad
};
