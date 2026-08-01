import { body, query } from 'express-validator';

import { USER_STATUS } from '../constants/domain.constants.js';
import ApiError from '../utils/ApiError.js';
import { validateIdParam } from './common.validator.js';

const userStatuses = Object.values(USER_STATUS);

const createFields = [
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

const updateFields = [
  'nombres',
  'apellidos',
  'correo',
  'estado',
  'rol_id',
  'estudiante_id',
  'docente_id',
  'debe_cambiar_password'
];

const listFields = ['correo', 'estado', 'rol', 'page', 'limit'];
const sensitiveRejectedFields = [
  'password_hash',
  'refresh_token_hash',
  'refresh_token',
  'refreshToken',
  'tokens',
  'session_id',
  'sessionId'
];

const redactRejectedField = (field) =>
  sensitiveRejectedFields.includes(field) ? 'campo_sensible_no_permitido' : field;

const validateAllowedUsuarioFields = (allowedFields, options = {}) => (req, res, next) => {
  const body = req.body ?? {};
  const fields = Object.keys(body);
  const unknownFields = fields.filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    return next(
      new ApiError(
        400,
        'Existen campos no permitidos en la solicitud.',
        'UNKNOWN_FIELDS',
        unknownFields.map(redactRejectedField)
      )
    );
  }

  if (options.requireAtLeastOne && fields.length === 0) {
    return next(new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_REQUEST_BODY'));
  }

  return next();
};

const validateAllowedQueryFields = (allowedFields) => (req, res, next) => {
  const fields = Object.keys(req.query ?? {});
  const unknownFields = fields.filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    return next(
      new ApiError(
        400,
        'Existen filtros no permitidos en la solicitud.',
        'UNKNOWN_QUERY_FIELDS',
        unknownFields.map(redactRejectedField)
      )
    );
  }

  return next();
};

const stringRule = (field, label, max) =>
  body(field)
    .optional()
    .isString()
    .withMessage(`${label} debe ser texto.`)
    .bail()
    .trim()
    .isLength({ min: 1, max })
    .withMessage(`${label} tiene una longitud invalida.`);

const nullableIdRule = (field, label) =>
  body(field)
    .optional({ nullable: true })
    .customSanitizer((value) => (value === null || value === '' ? null : value))
    .if((value) => value !== null)
    .isInt({ min: 1 })
    .withMessage(`${label} debe ser un entero positivo.`)
    .toInt();

const commonRules = [
  stringRule('nombres', 'Los nombres', 100),
  stringRule('apellidos', 'Los apellidos', 100),
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
    .isIn(userStatuses)
    .withMessage(`El estado debe ser uno de: ${userStatuses.join(', ')}.`),
  body('rol_id').optional().isInt({ min: 1 }).withMessage('El rol debe ser un entero positivo.').toInt(),
  nullableIdRule('estudiante_id', 'El estudiante'),
  nullableIdRule('docente_id', 'El docente'),
  body('debe_cambiar_password')
    .optional()
    .isBoolean()
    .withMessage('El campo debe_cambiar_password debe ser booleano.')
    .toBoolean()
];

const passwordRule = () =>
  body('password')
    .exists()
    .withMessage('La contrasena es obligatoria.')
    .bail()
    .isString()
    .withMessage('La contrasena debe ser texto.')
    .bail()
    .isLength({ min: 10, max: 128 })
    .withMessage('La contrasena debe tener entre 10 y 128 caracteres.');

export const validateListUsuarios = [
  validateAllowedQueryFields(listFields),
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
    .isIn(userStatuses)
    .withMessage(`El estado debe ser uno de: ${userStatuses.join(', ')}.`),
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

export const validateCreateUsuario = [
  validateAllowedUsuarioFields(createFields),
  body('nombres').exists().withMessage('Los nombres son obligatorios.'),
  body('apellidos').exists().withMessage('Los apellidos son obligatorios.'),
  body('correo').exists().withMessage('El correo es obligatorio.'),
  body('rol_id').exists().withMessage('El rol es obligatorio.'),
  passwordRule(),
  ...commonRules
];

export const validateUpdateUsuario = [validateAllowedUsuarioFields(updateFields, { requireAtLeastOne: true }), ...commonRules];

export const validateChangeEstadoUsuario = [
  validateAllowedUsuarioFields(['estado']),
  body('estado')
    .exists()
    .withMessage('El estado es obligatorio.')
    .bail()
    .isIn(userStatuses)
    .withMessage(`El estado debe ser uno de: ${userStatuses.join(', ')}.`)
];

export const validateChangePasswordUsuario = [validateAllowedUsuarioFields(['password']), passwordRule()];

export { validateIdParam };

export default {
  validateListUsuarios,
  validateCreateUsuario,
  validateUpdateUsuario,
  validateChangeEstadoUsuario,
  validateChangePasswordUsuario,
  validateIdParam
};
