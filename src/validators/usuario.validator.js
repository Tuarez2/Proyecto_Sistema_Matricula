import { body, query } from 'express-validator';

import { USER_STATUS } from '../constants/domain.constants.js';
import ApiError from '../utils/ApiError.js';
import { validarIdParam } from './common.validator.js';

const estadosUsuario = Object.values(USER_STATUS);

const camposCreacion = [
  'nombres',
  'apellidos',
  'correo',
  'password',
  'estado',
  'rol_id',
  'estudiante_id',
  'docente_id',
  'debe_cambiar_password'
];

const camposActualizacion = [
  'nombres',
  'apellidos',
  'correo',
  'estado',
  'rol_id',
  'estudiante_id',
  'docente_id',
  'debe_cambiar_password'
];

const camposListado = ['correo', 'estado', 'rol', 'page', 'limit'];
const camposSensiblesRechazados = [
  'password_hash',
  'refresh_token_hash',
  'refresh_token',
  'refreshToken',
  'tokens',
  'session_id',
  'sessionId'
];

const redactarCampoRechazado = (campo) =>
  camposSensiblesRechazados.includes(campo) ? 'campo_sensible_no_permitido' : campo;

const validarCamposPermitidosUsuario = (camposPermitidos, opciones = {}) => (req, res, next) => {
  const cuerpoSolicitud = req.body ?? {};
  const campos = Object.keys(cuerpoSolicitud);
  const camposDesconocidos = campos.filter((campo) => !camposPermitidos.includes(campo));

  if (camposDesconocidos.length > 0) {
    return next(
      new ApiError(
        400,
        'Existen campos no permitidos en la solicitud.',
        'UNKNOWN_FIELDS',
        camposDesconocidos.map(redactarCampoRechazado)
      )
    );
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
    return next(
      new ApiError(
        400,
        'Existen filtros no permitidos en la solicitud.',
        'UNKNOWN_QUERY_FIELDS',
        camposDesconocidos.map(redactarCampoRechazado)
      )
    );
  }

  return next();
};

const reglaTexto = (campo, etiqueta, maximo) =>
  body(campo)
    .optional()
    .isString()
    .withMessage(`${etiqueta} debe ser texto.`)
    .bail()
    .trim()
    .isLength({ min: 1, max: maximo })
    .withMessage(`${etiqueta} tiene una longitud invalida.`);

const reglaIdNullable = (campo, etiqueta) =>
  body(campo)
    .optional({ nullable: true })
    .customSanitizer((value) => (value === null || value === '' ? null : value))
    .if((value) => value !== null)
    .isInt({ min: 1 })
    .withMessage(`${etiqueta} debe ser un entero positivo.`)
    .toInt();

const reglasComunes = [
  reglaTexto('nombres', 'Los nombres', 100),
  reglaTexto('apellidos', 'Los apellidos', 100),
  body('correo')
    .optional()
    .isEmail()
    .withMessage('El correo debe tener un formato valido.')
    .bail()
    .isLength({ max: 150 })
    .withMessage('El correo es demasiado largo.')
    .normalizeEmail(),
  body('estado')
    .optional()
    .isIn(estadosUsuario)
    .withMessage(`El estado debe ser uno de: ${estadosUsuario.join(', ')}.`),
  body('rol_id').optional().isInt({ min: 1 }).withMessage('El rol debe ser un entero positivo.').toInt(),
  reglaIdNullable('estudiante_id', 'El estudiante'),
  reglaIdNullable('docente_id', 'El docente'),
  body('debe_cambiar_password')
    .optional()
    .isBoolean()
    .withMessage('El campo debe_cambiar_password debe ser booleano.')
    .toBoolean()
];

const reglaPassword = () =>
  body('password')
    .exists()
    .withMessage('La contrasena es obligatoria.')
    .bail()
    .isString()
    .withMessage('La contrasena debe ser texto.')
    .bail()
    .isLength({ min: 10, max: 128 })
    .withMessage('La contrasena debe tener entre 10 y 128 caracteres.');

export const validarListadoUsuarios = [
  validarFiltrosPermitidos(camposListado),
  query('correo')
    .optional()
    .isString()
    .withMessage('El filtro correo debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('El filtro correo tiene una longitud invalida.'),
  query('estado')
    .optional()
    .isIn(estadosUsuario)
    .withMessage(`El estado debe ser uno de: ${estadosUsuario.join(', ')}.`),
  query('rol')
    .optional()
    .isString()
    .withMessage('El filtro rol debe ser texto.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('El filtro rol tiene una longitud invalida.'),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100.').toInt()
];

export const validarCreacionUsuario = [
  validarCamposPermitidosUsuario(camposCreacion),
  body('nombres').exists().withMessage('Los nombres son obligatorios.'),
  body('apellidos').exists().withMessage('Los apellidos son obligatorios.'),
  body('correo').exists().withMessage('El correo es obligatorio.'),
  body('rol_id').exists().withMessage('El rol es obligatorio.'),
  reglaPassword(),
  ...reglasComunes
];

export const validarActualizacionUsuario = [validarCamposPermitidosUsuario(camposActualizacion, { requireAtLeastOne: true }), ...reglasComunes];

export const validarCambioEstadoUsuario = [
  validarCamposPermitidosUsuario(['estado']),
  body('estado')
    .exists()
    .withMessage('El estado es obligatorio.')
    .bail()
    .isIn(estadosUsuario)
    .withMessage(`El estado debe ser uno de: ${estadosUsuario.join(', ')}.`)
];

export const validarCambioPasswordUsuario = [validarCamposPermitidosUsuario(['password']), reglaPassword()];

export { validarIdParam };

export default {
  validarListadoUsuarios,
  validarCreacionUsuario,
  validarActualizacionUsuario,
  validarCambioEstadoUsuario,
  validarCambioPasswordUsuario,
  validarIdParam
};
