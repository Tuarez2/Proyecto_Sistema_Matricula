import ApiError from '../utils/ApiError.js';

const authenticate = (req, res, next) => {
  next(new ApiError(501, 'Autenticacion pendiente de implementar.', 'AUTHENTICATION_NOT_IMPLEMENTED'));
};

export default authenticate;
