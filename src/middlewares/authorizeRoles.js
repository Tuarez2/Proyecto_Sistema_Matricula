import ApiError from '../utils/ApiError.js';

const authorizeRoles = (...roles) => (req, res, next) => {
  next(new ApiError(501, 'Autorizacion pendiente de implementar.', 'AUTHORIZATION_NOT_IMPLEMENTED', { roles }));
};

export default authorizeRoles;
