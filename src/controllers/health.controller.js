import { sequelize } from '../models/index.js';
import { successResponse } from '../utils/apiResponse.js';

export const healthCheck = async (_req, res, next) => {
  try {
    await sequelize.authenticate();

    return successResponse(res, {
      message: 'Backend operativo',
      data: {
        database: 'connected'
      }
    });
  } catch (error) {
    return next(error);
  }
};
