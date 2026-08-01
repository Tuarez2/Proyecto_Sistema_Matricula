import ApiError from '../utils/ApiError.js';

const notFound = (req, res, next) => {
  next(new ApiError(404, 'Ruta no encontrada.', 'NOT_FOUND'));
};

export default notFound;
