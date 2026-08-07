import { body, query } from 'express-validator';

import { ACADEMIC_PERIOD_STATUS } from '../constants/domain.constants.js';
import ApiError from '../utils/ApiError.js';
import { validarIdParam } from './common.validator.js';
import { reglaCodigoOpcional } from './reglasComunes.js';

const estadosPeriodo = Object.values(ACADEMIC_PERIOD_STATUS);
const camposCreacion = [
  'codigo',
  'nombre',
  'fecha_inicio',
  'fecha_fin',
  'fecha_inicio_matricula',
  'fecha_fin_matricula',
  'estado'
];
const camposActualizacion = [
  'codigo',
  'nombre',
  'fecha_inicio',
  'fecha_fin',
  'fecha_inicio_matricula',
  'fecha_fin_matricula'
];
const camposEstado = ['estado'];
const camposListado = ['codigo', 'nombre', 'estado', 'anio', 'fecha_inicio', 'fecha_fin', 'page', 'limit'];

const validarCamposPermitidosPeriodo = (camposPermitidos, opciones = {}) => (req, res, next) => {
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

const reglaNombre = () =>
  body('nombre')
    .optional()
    .isString()
    .withMessage('El nombre debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre tiene una longitud invalida.');

const reglaFechaDia = (campo, etiqueta) =>
  body(campo)
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${etiqueta} debe tener formato YYYY-MM-DD.`)
    .bail()
    .isISO8601({ strict: true })
    .withMessage(`${etiqueta} debe tener un formato de fecha valido.`);

const reglaFechaHora = (campo, etiqueta) =>
  body(campo)
    .optional()
    .isISO8601({ strict: true })
    .withMessage(`${etiqueta} debe tener un formato de fecha y hora valido.`);

const reglaOrdenFechas = () =>
  body('fecha_inicio').custom((fechaInicio, { req }) => {
    const cuerpo = req.body ?? {};
    const { fecha_fin, fecha_inicio_matricula, fecha_fin_matricula } = cuerpo;

    if (fechaInicio && fecha_fin && new Date(fechaInicio) >= new Date(fecha_fin)) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin.');
    }

    if (
      fecha_inicio_matricula &&
      fecha_fin_matricula &&
      new Date(fecha_inicio_matricula) >= new Date(fecha_fin_matricula)
    ) {
      throw new Error('La fecha de inicio de matricula debe ser anterior a la fecha de fin de matricula.');
    }

    if (
      fechaInicio &&
      fecha_fin &&
      fecha_inicio_matricula &&
      fecha_fin_matricula &&
      (new Date(fecha_inicio_matricula) < new Date(fechaInicio) ||
        new Date(fecha_fin_matricula) > new Date(fecha_fin))
    ) {
      throw new Error('La ventana de matricula debe estar dentro del periodo academico.');
    }

    return true;
  });

const reglasComunes = [
  reglaCodigo(),
  reglaNombre(),
  reglaFechaDia('fecha_inicio', 'La fecha de inicio'),
  reglaFechaDia('fecha_fin', 'La fecha de fin'),
  reglaFechaHora('fecha_inicio_matricula', 'La fecha de inicio de matricula'),
  reglaFechaHora('fecha_fin_matricula', 'La fecha de fin de matricula')
];

export const validarListadoPeriodos = [
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
    .isLength({ min: 1, max: 100 })
    .withMessage('El filtro nombre tiene una longitud invalida.'),
  query('estado')
    .optional()
    .isIn(estadosPeriodo)
    .withMessage(`El estado debe ser uno de: ${estadosPeriodo.join(', ')}.`),
  query('anio').optional().isInt({ min: 1900, max: 2200 }).withMessage('El anio debe ser valido.').toInt(),
  query('fecha_inicio')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('La fecha de inicio debe tener formato YYYY-MM-DD.')
    .bail()
    .isISO8601({ strict: true })
    .withMessage('La fecha de inicio es invalida.'),
  query('fecha_fin')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('La fecha de fin debe tener formato YYYY-MM-DD.')
    .bail()
    .isISO8601({ strict: true })
    .withMessage('La fecha de fin es invalida.'),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export const validarCreacionPeriodo = [
  validarCamposPermitidosPeriodo(camposCreacion),
  body('codigo').exists().withMessage('El codigo es obligatorio.'),
  body('nombre').exists().withMessage('El nombre es obligatorio.'),
  body('fecha_inicio').exists().withMessage('La fecha de inicio es obligatoria.'),
  body('fecha_fin').exists().withMessage('La fecha de fin es obligatoria.'),
  body('fecha_inicio_matricula').exists().withMessage('La fecha de inicio de matricula es obligatoria.'),
  body('fecha_fin_matricula').exists().withMessage('La fecha de fin de matricula es obligatoria.'),
  ...reglasComunes,
  reglaOrdenFechas(),
  body('estado')
    .optional()
    .isIn(estadosPeriodo)
    .withMessage(`El estado debe ser uno de: ${estadosPeriodo.join(', ')}.`)
];

export const validarActualizacionPeriodo = [
  validarCamposPermitidosPeriodo(camposActualizacion, { requireAtLeastOne: true }),
  ...reglasComunes,
  reglaOrdenFechas()
];

export const validarEstadoPeriodo = [
  validarCamposPermitidosPeriodo(camposEstado),
  body('estado')
    .exists()
    .withMessage('El estado es obligatorio.')
    .bail()
    .isIn(estadosPeriodo)
    .withMessage(`El estado debe ser uno de: ${estadosPeriodo.join(', ')}.`)
];

export const validarIdPeriodo = validarIdParam;

export default {
  validarListadoPeriodos,
  validarIdPeriodo,
  validarCreacionPeriodo,
  validarActualizacionPeriodo,
  validarEstadoPeriodo
};
