import { BaseError, UniqueConstraintError, ValidationError } from 'sequelize';
import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = statusCode < 500;

  if (err instanceof UniqueConstraintError) {
    return errorResponse(res, {
      statusCode: 409,
      message: 'Ya existe un registro con los datos únicos enviados',
      errors: err.errors.map((error) => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err instanceof ValidationError) {
    return errorResponse(res, {
      statusCode: 422,
      message: 'Error de validación',
      errors: err.errors.map((error) => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err instanceof BaseError) {
    return errorResponse(res, {
      statusCode: 500,
      message: 'Error de base de datos'
    });
  }

  return errorResponse(res, {
    statusCode,
    message: isOperational ? err.message : 'Error interno del servidor',
    errors: err.errors
  });
};
