import { validationResult } from 'express-validator';

import ApiError from '../utils/ApiError.js';

const validarSolicitud = (req, res, next) => {
  const resultado = validationResult(req);

  if (resultado.isEmpty()) {
    return next();
  }

  return next(new ApiError(400, 'Error de validacion.', 'REQUEST_VALIDATION_ERROR', resultado.array()));
};

export default validarSolicitud;
