import { body, param, query } from 'express-validator';

import ApiError from '../utils/ApiError.js';

const camposPermitidos = ['carrera_id', 'asignatura_id'];
const camposListado = [
  'page',
  'limit',
  'carrera_id',
  'asignatura_id',
  'codigo_carrera',
  'nombre_carrera',
  'codigo_asignatura',
  'nombre_asignatura'
];
const camposListadoCarrera = ['page', 'limit', 'activo'];

const validarCamposPermitidosAsignacion = (camposPermitidosSolicitud, opciones = {}) => (req, res, next) => {
  const cuerpoSolicitud = req.body ?? {};
  const campos = Object.keys(cuerpoSolicitud);
  const camposDesconocidos = campos.filter((campo) => !camposPermitidosSolicitud.includes(campo));

  if (camposDesconocidos.length > 0) {
    return next(new ApiError(400, 'Existen campos no permitidos en la solicitud.', 'UNKNOWN_FIELDS', camposDesconocidos));
  }

  if (opciones.requireAtLeastOne && campos.length === 0) {
    return next(new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_REQUEST_BODY'));
  }

  return next();
};

const validarFiltrosPermitidos = (camposPermitidosSolicitud) => (req, res, next) => {
  const campos = Object.keys(req.query ?? {});
  const camposDesconocidos = campos.filter((campo) => !camposPermitidosSolicitud.includes(campo));

  if (camposDesconocidos.length > 0) {
    return next(new ApiError(400, 'Existen filtros no permitidos en la solicitud.', 'UNKNOWN_QUERY_FIELDS', camposDesconocidos));
  }

  return next();
};

const reglaIdCuerpo = (campo, etiqueta) =>
  body(campo).optional().isInt({ min: 1 }).withMessage(`${etiqueta} debe ser un entero positivo.`).toInt();

const reglaTextoFiltro = (campo, etiqueta, maximo) =>
  query(campo)
    .optional()
    .isString()
    .withMessage(`${etiqueta} debe ser texto.`)
    .bail()
    .trim()
    .isLength({ min: 1, max: maximo })
    .withMessage(`${etiqueta} tiene una longitud invalida.`);

export const validarListadoMallaCurricular = [
  validarFiltrosPermitidos(camposListado),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt(),
  query('carrera_id').optional().isInt({ min: 1 }).withMessage('La carrera debe ser un entero positivo.').toInt(),
  query('asignatura_id').optional().isInt({ min: 1 }).withMessage('La asignatura debe ser un entero positivo.').toInt(),
  reglaTextoFiltro('codigo_carrera', 'El filtro codigo_carrera', 20),
  reglaTextoFiltro('nombre_carrera', 'El filtro nombre_carrera', 150),
  reglaTextoFiltro('codigo_asignatura', 'El filtro codigo_asignatura', 20),
  reglaTextoFiltro('nombre_asignatura', 'El filtro nombre_asignatura', 150)
];

export const validarListadoAsignaturasPorCarrera = [
  validarFiltrosPermitidos(camposListadoCarrera),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt(),
  query('activo').optional().isBoolean().withMessage('El filtro activo debe ser booleano.').toBoolean()
];

export const validarIdAsignacion = [
  param('id')
    .matches(/^\d+-\d+$/)
    .withMessage('El id de asignacion debe tener formato carrera_id-asignatura_id.')
];

export const validarCarreraId = [
  param('carreraId')
    .isInt({ min: 1 })
    .withMessage('La carrera debe ser un entero positivo.')
    .toInt()
];

export const validarCreacionAsignacion = [
  validarCamposPermitidosAsignacion(camposPermitidos),
  body('carrera_id').exists().withMessage('La carrera es obligatoria.'),
  body('asignatura_id').exists().withMessage('La asignatura es obligatoria.'),
  reglaIdCuerpo('carrera_id', 'La carrera'),
  reglaIdCuerpo('asignatura_id', 'La asignatura')
];

export const validarActualizacionAsignacion = [
  validarCamposPermitidosAsignacion(camposPermitidos, { requireAtLeastOne: true }),
  reglaIdCuerpo('carrera_id', 'La carrera'),
  reglaIdCuerpo('asignatura_id', 'La asignatura')
];

export default {
  validarListadoMallaCurricular,
  validarListadoAsignaturasPorCarrera,
  validarIdAsignacion,
  validarCarreraId,
  validarCreacionAsignacion,
  validarActualizacionAsignacion
};
