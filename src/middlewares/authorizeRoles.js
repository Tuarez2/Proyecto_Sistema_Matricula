import ApiError from '../utils/ApiError.js';

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Autenticacion requerida.', 'AUTHENTICATION_REQUIRED'));
  }

  const userRoleCode = req.user.rol?.codigo;

  if (!roles.includes(userRoleCode)) {
    return next(new ApiError(403, 'No tiene permisos para realizar esta accion.', 'FORBIDDEN'));
  }

  return next();
};

export default authorizeRoles;
