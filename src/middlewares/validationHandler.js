import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

export const validationHandler = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return errorResponse(res, {
    statusCode: 422,
    message: 'Error de validación',
    errors: result.array().map((error) => ({
      field: error.path,
      message: error.msg
    }))
  });
};
