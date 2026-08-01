import * as estudianteService from '../services/estudiante.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const obtenerEstudiantes = asyncHandler(async (req, res) => {
  const estudiantes = await estudianteService.listarEstudiantes();

  res.status(200).json({
    success: true,
    data: estudiantes
  });
});

export const obtenerEstudiantePorId = asyncHandler(async (req, res) => {
  const estudiante = await estudianteService.obtenerEstudiantePorId(req.params.id);

  res.status(200).json({
    success: true,
    data: estudiante
  });
});

export const crearEstudiante = asyncHandler(async (req, res) => {
  const estudiante = await estudianteService.crearEstudiante(req.body);

  res.status(201).json({
    success: true,
    message: 'Estudiante creado correctamente.',
    data: estudiante
  });
});

export const actualizarEstudiante = asyncHandler(async (req, res) => {
  const estudiante = await estudianteService.actualizarEstudiante(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Estudiante actualizado correctamente.',
    data: estudiante
  });
});

export const eliminarEstudiante = asyncHandler(async (req, res) => {
  const estudiante = await estudianteService.eliminarEstudiante(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Estudiante inactivado correctamente.',
    data: estudiante
  });
});

export default {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
};
