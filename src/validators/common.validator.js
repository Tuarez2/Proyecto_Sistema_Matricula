import { param } from 'express-validator';

import ApiError from '../utils/ApiError.js';

export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id debe ser un entero positivo.')
    .toInt()
];

export const validateAllowedFields = (allowedFields, options = {}) => (req, res, next) => {
  const body = req.body ?? {};
  const fields = Object.keys(body);
  const unknownFields = fields.filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    return next(new ApiError(400, 'Existen campos no permitidos en la solicitud.', 'UNKNOWN_FIELDS', unknownFields));
  }

  if (options.requireAtLeastOne && fields.length === 0) {
    return next(new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_REQUEST_BODY'));
  }

  return next();
};
