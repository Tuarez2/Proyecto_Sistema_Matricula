import * as usuarioService from '../services/usuario.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const obtenerUsuarios = asyncHandler(async (req, res) => {
  const result = await usuarioService.listarUsuarios(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages
  });
});

export const obtenerUsuarioPorId = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.obtenerUsuarioPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: usuario
  });
});

export const crearUsuario = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.crearUsuario(req.body);

  res.status(201).json({
    success: true,
    message: 'Usuario creado correctamente.',
    data: usuario
  });
});

export const actualizarUsuario = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.actualizarUsuario(req.params.id, req.body, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Usuario actualizado correctamente.',
    data: usuario
  });
});

export const cambiarEstadoUsuario = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.cambiarEstadoUsuario(req.params.id, req.body.estado, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Estado de usuario actualizado correctamente.',
    data: usuario
  });
});

export const cambiarPasswordUsuario = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.cambiarPasswordUsuario(req.params.id, req.body.password);

  res.status(200).json({
    success: true,
    message: 'Contrasena de usuario actualizada correctamente.',
    data: usuario
  });
});

export default {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  cambiarPasswordUsuario
};
