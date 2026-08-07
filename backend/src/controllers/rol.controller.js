import * as rolService from '../services/rol.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerRoles = manejadorAsync(async (req, res) => {
  const roles = await rolService.listarRoles();

  res.status(200).json({
    success: true,
    data: roles
  });
});

export default {
  obtenerRoles
};
