export const successResponse = (
  res,
  { statusCode = 200, message = 'Operación exitosa', data = null, meta = null } = {}
) => {
  const body = {
    success: true,
    message,
    data
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
};

export const errorResponse = (
  res,
  { statusCode = 500, message = 'Error interno del servidor', errors = null } = {}
) => {
  const body = {
    success: false,
    message
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};
