import * as authService from '../services/auth.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, req);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesion correcto.',
    data
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Tokens renovados correctamente.',
    data
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.sessionId);

  res.status(200).json({
    success: true,
    message: 'Sesion cerrada correctamente.'
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getAuthenticatedUser(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

export default {
  login,
  refresh,
  logout,
  me
};
