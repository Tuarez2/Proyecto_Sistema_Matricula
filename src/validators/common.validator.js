import { param } from 'express-validator';

import ApiError from '../utils/ApiError.js';

export const validarIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id debe ser un entero positivo.')
    .toInt()
];

export const validarCamposPermitidos = (camposPermitidos, opciones = {}) => (req, res, next) => {
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
