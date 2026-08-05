import * as carreraService from '../services/carrera.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerCarreras = manejadorAsync(async (req, res) => {
  const resultado = await carreraService.listarCarreras(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerCarreraPorId = manejadorAsync(async (req, res) => {
  const carrera = await carreraService.obtenerCarreraPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: carrera
  });
});

export const crearCarrera = manejadorAsync(async (req, res) => {
  const carrera = await carreraService.crearCarrera(req.body);

  res.status(201).json({
    success: true,
    message: 'Carrera creada correctamente.',
    data: carrera
  });
});

export const actualizarCarrera = manejadorAsync(async (req, res) => {
  const carrera = await carreraService.actualizarCarrera(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Carrera actualizada correctamente.',
    data: carrera
  });
});

export const eliminarCarrera = manejadorAsync(async (req, res) => {
  const carrera = await carreraService.eliminarCarrera(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Carrera inactivada correctamente.',
    data: carrera
  });
});

export default {
  obtenerCarreras,
  obtenerCarreraPorId,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera
};
