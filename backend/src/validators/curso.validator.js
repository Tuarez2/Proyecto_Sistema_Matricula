import { body, query } from 'express-validator';

import { COURSE_STATUS, CUPO_MAXIMO_MAX, CUPO_MAXIMO_MIN } from '../constants/domain.constants.js';
import { validarCamposPermitidos, validarIdParam } from './common.validator.js';
import ApiError from '../utils/ApiError.js';

const camposPermitidos = [
  'periodo_id',
  'asignatura_id',
  'docente_id',
  'paralelo',
  'aula',
  'horario',
  'cupo_maximo',
  'estado'
];

const camposPermitidosListado = [
  'periodo_id',
  'asignatura_id',
  'docente_id',
  'estado',
  'paralelo',
  'page',
  'limit'
];

const validarFiltrosPermitidos = (camposPermitidosFiltro) => (req, res, next) => {
  const filtrosSolicitud = req.query ?? {};
  const camposDesconocidos = Object.keys(filtrosSolicitud).filter(
    (campo) => !camposPermitidosFiltro.includes(campo)
  );

  if (camposDesconocidos.length > 0) {
    return next(new ApiError(400, 'Existen filtros no permitidos en la solicitud.', 'UNKNOWN_QUERY_FILTERS', camposDesconocidos));
  }

  return next();
};

const validarTexto = (campo, etiqueta, max) =>
  body(campo)
    .optional()
    .isString()
    .withMessage(`${etiqueta} debe ser texto.`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${etiqueta} es obligatorio.`)
    .bail()
    .isLength({ max })
    .withMessage(`${etiqueta} es invalido.`);

const reglas = [
  body('periodo_id').optional().isInt({ min: 1 }).withMessage('El periodo academico debe ser valido.').toInt(),
  body('asignatura_id').optional().isInt({ min: 1 }).withMessage('La asignatura debe ser valida.').toInt(),
  body('docente_id').optional().isInt({ min: 1 }).withMessage('El docente debe ser valido.').toInt(),
  validarTexto('paralelo', 'El paralelo', 10),
  validarTexto('aula', 'El aula', 50),
  validarTexto('horario', 'El horario', 150),
  body('cupo_maximo')
    .optional()
    .isInt({ min: CUPO_MAXIMO_MIN, max: CUPO_MAXIMO_MAX })
    .withMessage(`El cupo maximo debe estar entre ${CUPO_MAXIMO_MIN} y ${CUPO_MAXIMO_MAX}.`)
    .toInt(),
  body('estado').optional().isIn(Object.values(COURSE_STATUS)).withMessage('El estado del curso no es valido.')
];

export const validarListadoCursos = [
  validarFiltrosPermitidos(camposPermitidosListado),
  query('periodo_id').optional().isInt({ min: 1 }).withMessage('El periodo academico debe ser valido.').toInt(),
  query('asignatura_id').optional().isInt({ min: 1 }).withMessage('La asignatura debe ser valida.').toInt(),
  query('docente_id').optional().isInt({ min: 1 }).withMessage('El docente debe ser valido.').toInt(),
  query('estado').optional().isIn(Object.values(COURSE_STATUS)).withMessage('El estado del curso no es valido.'),
  query('paralelo').optional().trim().isLength({ min: 1, max: 10 }).withMessage('El paralelo es invalido.'),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El limite debe estar entre 1 y 100.')
    .toInt()
];

export const validarCreacionCurso = [
  validarCamposPermitidos(camposPermitidos),
  body('periodo_id').exists().withMessage('El periodo academico es obligatorio.'),
  body('asignatura_id').exists().withMessage('La asignatura es obligatoria.'),
  body('docente_id').exists().withMessage('El docente es obligatorio.'),
  body('paralelo').exists().withMessage('El paralelo es obligatorio.'),
  body('aula').exists().withMessage('El aula es obligatoria.'),
  body('horario').exists().withMessage('El horario es obligatorio.'),
  body('cupo_maximo').exists().withMessage('El cupo maximo es obligatorio.'),
  ...reglas
];

export const validarActualizacionCurso = [validarCamposPermitidos(camposPermitidos, { requireAtLeastOne: true }), ...reglas];

export { validarIdParam };

export default {
  validarListadoCursos,
  validarCreacionCurso,
  validarActualizacionCurso,
  validarIdParam
};
