import { body, query } from 'express-validator';

import { ENROLLMENT_STATUS } from '../constants/domain.constants.js';
import ApiError from '../utils/ApiError.js';
import { validarCamposPermitidos, validarIdParam } from './common.validator.js';

const estadosMatricula = Object.values(ENROLLMENT_STATUS);
const camposCreacion = ['estudiante_id', 'curso_id'];
const camposCreacionLote = ['estudiante_id', 'curso_ids'];
const LIMITE_CURSOS_MATRICULA_LOTE = 10;
const camposEstado = ['estado'];
const camposListado = [
  'estudiante_id',
  'curso_id',
  'estado',
  'periodo_id',
  'asignatura_id',
  'carrera_id',
  'fecha_desde',
  'fecha_hasta',
  'page',
  'limit'
];

const validarFiltrosPermitidos = (camposPermitidos) => (req, res, next) => {
  const campos = Object.keys(req.query ?? {});
  const camposDesconocidos = campos.filter((campo) => !camposPermitidos.includes(campo));

  if (camposDesconocidos.length > 0) {
    return next(new ApiError(400, 'Existen filtros no permitidos en la solicitud.', 'UNKNOWN_QUERY_FIELDS', camposDesconocidos));
  }

  return next();
};

const reglaIdQuery = (campo, etiqueta) =>
  query(campo)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${etiqueta} debe ser un entero positivo.`)
    .toInt();

const reglaFechaQuery = (campo, etiqueta) =>
  query(campo)
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${etiqueta} debe tener formato YYYY-MM-DD.`)
    .bail()
    .isISO8601({ strict: true })
    .withMessage(`${etiqueta} debe ser una fecha valida.`);

export const validarListadoMatriculas = [
  validarFiltrosPermitidos(camposListado),
  reglaIdQuery('estudiante_id', 'El estudiante'),
  reglaIdQuery('curso_id', 'El curso'),
  reglaIdQuery('periodo_id', 'El periodo academico'),
  reglaIdQuery('asignatura_id', 'La asignatura'),
  reglaIdQuery('carrera_id', 'La carrera'),
  query('estado')
    .optional()
    .isIn(estadosMatricula)
    .withMessage(`El estado debe ser uno de: ${estadosMatricula.join(', ')}.`),
  reglaFechaQuery('fecha_desde', 'La fecha desde'),
  reglaFechaQuery('fecha_hasta', 'La fecha hasta'),
  query('fecha_hasta').custom((fechaHasta, { req }) => {
    if (!req.query.fecha_desde || !fechaHasta) {
      return true;
    }

    if (new Date(req.query.fecha_desde) > new Date(fechaHasta)) {
      throw new Error('La fecha desde no puede ser posterior a la fecha hasta.');
    }

    return true;
  }),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export const validarCreacionMatricula = [
  validarCamposPermitidos(camposCreacion),
  body('estudiante_id')
    .exists()
    .withMessage('El estudiante es obligatorio.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('El estudiante debe ser valido.')
    .toInt(),
  body('curso_id')
    .exists()
    .withMessage('El curso es obligatorio.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('El curso debe ser valido.')
    .toInt()
];

export const validarCreacionMatriculasLote = [
  validarCamposPermitidos(camposCreacionLote),
  body('estudiante_id')
    .exists()
    .withMessage('El estudiante es obligatorio.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('El estudiante debe ser valido.')
    .toInt(),
  body('curso_ids')
    .exists()
    .withMessage('Los cursos son obligatorios.')
    .bail()
    .isArray({ min: 1 })
    .withMessage('Debe enviar al menos un curso.')
    .bail()
    .custom((cursoIds) => cursoIds.length <= LIMITE_CURSOS_MATRICULA_LOTE)
    .withMessage(`El limite de cursos por solicitud es ${LIMITE_CURSOS_MATRICULA_LOTE}.`)
    .custom((cursoIds) => new Set(cursoIds).size === cursoIds.length)
    .withMessage('Los cursos no pueden repetirse.')
    .custom((cursoIds) => cursoIds.every((cursoId) => Number.isInteger(cursoId) && cursoId >= 1))
    .withMessage('Cada curso debe ser un entero positivo.')
];

export const validarEstadoMatricula = [
  validarCamposPermitidos(camposEstado),
  body('estado')
    .exists()
    .withMessage('El estado es obligatorio.')
    .bail()
    .isIn(estadosMatricula)
    .withMessage(`El estado debe ser uno de: ${estadosMatricula.join(', ')}.`)
];

export const validarIdMatricula = validarIdParam;

export default {
  validarListadoMatriculas,
  validarIdMatricula,
  validarCreacionMatricula,
  validarCreacionMatriculasLote,
  validarEstadoMatricula
};
