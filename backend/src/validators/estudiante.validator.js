import { body, query } from 'express-validator';

import { ACADEMIC_STATUS, EDAD_MINIMA_ESTUDIANTE } from '../constants/domain.constants.js';
import {
  validarCamposPermitidos,
  validarFiltrosPermitidos,
  validarIdParam
} from './common.validator.js';
import {
  reglaCorreoOpcional,
  reglaFechaNacimientoOpcional,
  reglaIdentificacionOpcional,
  reglaNombreOpcional,
  reglaTelefonoOpcional,
  reglaTextoOpcional
} from './reglasComunes.js';

const camposCursosDisponibles = ['periodo_id'];

const camposPermitidos = [
  'carrera_id',
  'numero_matricula',
  'identificacion',
  'nombres',
  'apellidos',
  'correo',
  'telefono',
  'fecha_nacimiento',
  'estado_academico',
  'nivel_academico_actual'
];

const camposListado = [
  'numero_matricula',
  'identificacion',
  'nombres',
  'apellidos',
  'correo',
  'carrera_id',
  'estado_academico',
  'nivel_academico_actual',
  'page',
  'limit'
];

const reglas = [
  body('carrera_id').optional().isInt({ min: 1 }).withMessage('La carrera debe ser valida.').toInt(),
  reglaTextoOpcional('numero_matricula', 'El numero de matricula', { max: 30 }),
  reglaIdentificacionOpcional(),
  reglaNombreOpcional('nombres', 'Los nombres'),
  reglaNombreOpcional('apellidos', 'Los apellidos'),
  reglaCorreoOpcional(),
  reglaTelefonoOpcional(),
  reglaFechaNacimientoOpcional({ edadMinima: EDAD_MINIMA_ESTUDIANTE }),
  body('estado_academico')
    .optional()
    .isIn(Object.values(ACADEMIC_STATUS))
    .withMessage('El estado academico no es valido.'),
  body('nivel_academico_actual')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El nivel academico actual debe ser un entero positivo.')
    .toInt()
];

export const validarCreacionEstudiante = [
  validarCamposPermitidos(camposPermitidos),
  body('carrera_id').exists().withMessage('La carrera es obligatoria.'),
  body('numero_matricula').exists().withMessage('El numero de matricula es obligatorio.'),
  body('identificacion').exists().withMessage('La identificacion es obligatoria.'),
  body('nombres').exists().withMessage('Los nombres son obligatorios.'),
  body('apellidos').exists().withMessage('Los apellidos son obligatorios.'),
  body('correo').exists().withMessage('El correo es obligatorio.'),
  body('fecha_nacimiento').exists().withMessage('La fecha de nacimiento es obligatoria.'),
  body('nivel_academico_actual').exists().withMessage('El nivel academico actual es obligatorio.'),
  ...reglas
];

export const validarActualizacionEstudiante = [validarCamposPermitidos(camposPermitidos, { requireAtLeastOne: true }), ...reglas];

export const validarListadoEstudiantes = [
  validarFiltrosPermitidos(camposListado),
  query('numero_matricula')
    .optional()
    .isString()
    .withMessage('El filtro numero_matricula debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('El filtro numero_matricula tiene una longitud invalida.'),
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
  query('carrera_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El filtro carrera debe ser un entero positivo.')
    .toInt(),
  query('estado_academico')
    .optional()
    .isIn(Object.values(ACADEMIC_STATUS))
    .withMessage('El estado academico no es valido.'),
  query('nivel_academico_actual')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El nivel academico actual debe ser un entero positivo.')
    .toInt(),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export const validarCursosDisponiblesEstudiante = [
  validarFiltrosPermitidos(camposCursosDisponibles),
  query('periodo_id')
    .exists()
    .withMessage('El periodo academico es obligatorio.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('El periodo academico debe ser un entero positivo.')
    .toInt()
];

export { validarIdParam };

export default {
  validarCreacionEstudiante,
  validarActualizacionEstudiante,
  validarListadoEstudiantes,
  validarCursosDisponiblesEstudiante,
  validarIdParam
};
