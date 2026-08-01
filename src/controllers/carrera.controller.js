import * as carreraService from '../services/carrera.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const obtenerCarreras = asyncHandler(async (req, res) => {
  const carreras = await carreraService.listarCarreras();

  res.status(200).json({
    success: true,
    data: carreras
  });
});

export const obtenerCarreraPorId = asyncHandler(async (req, res) => {
  const carrera = await carreraService.obtenerCarreraPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: carrera
  });
});

export const crearCarrera = asyncHandler(async (req, res) => {
  const carrera = await carreraService.crearCarrera(req.body);

  res.status(201).json({
    success: true,
    message: 'Carrera creada correctamente.',
    data: carrera
  });
});

export const actualizarCarrera = asyncHandler(async (req, res) => {
  const carrera = await carreraService.actualizarCarrera(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Carrera actualizada correctamente.',
    data: carrera
  });
});

export const eliminarCarrera = asyncHandler(async (req, res) => {
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
