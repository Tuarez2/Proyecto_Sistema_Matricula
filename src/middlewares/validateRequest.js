import { validationResult } from 'express-validator';

import ApiError from '../utils/ApiError.js';

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(new ApiError(400, 'Error de validacion.', 'REQUEST_VALIDATION_ERROR', result.array()));
};

export default validateRequest;
