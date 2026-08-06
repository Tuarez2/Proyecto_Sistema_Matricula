import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';

import ApiError from '../utils/ApiError.js';

const errorHandler = (error, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details
    });
  }

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe.',
      code: 'UNIQUE_CONSTRAINT_ERROR',
      details: error.errors.map((item) => ({
        field: item.path,
        message: item.message
      }))
    });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      message: 'La relacion especificada no existe o impide completar la operacion.',
      code: 'FOREIGN_KEY_CONSTRAINT_ERROR',
      details: {
        table: error.table,
        fields: error.fields
      }
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Error de validacion.',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((item) => ({
        field: item.path,
        message: item.message
      }))
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('[error]', error);
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
    code: 'INTERNAL_SERVER_ERROR',
    stack: isProduction ? undefined : error.stack
  });
};

export default errorHandler;
