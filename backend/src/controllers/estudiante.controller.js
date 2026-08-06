import * as estudianteService from '../services/estudiante.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerEstudiantes = manejadorAsync(async (req, res) => {
  const resultado = await estudianteService.listarEstudiantes(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
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

export const obtenerCursosDisponibles = manejadorAsync(async (req, res) => {
  const resultado = await estudianteService.obtenerCursosDisponiblesEstudiante(
    req.params.id,
    req.query.periodo_id
  );

  res.status(200).json({
    success: true,
    data: resultado
  });
});

export default {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  obtenerCursosDisponibles
};
