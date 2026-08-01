import * as authService from '../services/auth.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const login = manejadorAsync(async (req, res) => {
  const datos = await authService.login(req.body, req);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesion correcto.',
    data: datos
  });
});

export const refresh = manejadorAsync(async (req, res) => {
  const datos = await authService.refresh(req.body.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Tokens renovados correctamente.',
    data: datos
  });
});

export const logout = manejadorAsync(async (req, res) => {
  await authService.logout(req.user.sessionId);

  res.status(200).json({
    success: true,
    message: 'Sesion cerrada correctamente.'
  });
});

export const me = manejadorAsync(async (req, res) => {
  const usuario = await authService.obtenerUsuarioAutenticado(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: usuario
    }
  });
});

export default {
  login,
  refresh,
  logout,
  me
};
