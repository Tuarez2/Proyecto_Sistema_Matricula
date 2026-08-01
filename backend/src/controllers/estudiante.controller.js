import * as estudianteService from '../services/estudiante.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerEstudiantes = manejadorAsync(async (req, res) => {
  const estudiantes = await estudianteService.listarEstudiantes();

  res.status(200).json({
    success: true,
    data: estudiantes
  });
});

export const obtenerEstudiantePorId = manejadorAsync(async (req, res) => {
  const estudiante = await estudianteService.obtenerEstudiantePorId(req.params.id);

  res.status(200).json({
    success: true,
    data: estudiante
  });
});

export const crearEstudiante = manejadorAsync(async (req, res) => {
  const estudiante = await estudianteService.crearEstudiante(req.body);

  res.status(201).json({
    success: true,
    message: 'Estudiante creado correctamente.',
    data: estudiante
  });
});

export const actualizarEstudiante = manejadorAsync(async (req, res) => {
  const estudiante = await estudianteService.actualizarEstudiante(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Estudiante actualizado correctamente.',
    data: estudiante
  });
});

export const eliminarEstudiante = manejadorAsync(async (req, res) => {
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
