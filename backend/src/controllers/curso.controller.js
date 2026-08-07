import * as cursoService from '../services/curso.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerCursos = manejadorAsync(async (req, res) => {
  const resultado = await cursoService.listarCursos(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerCursoPorId = manejadorAsync(async (req, res) => {
  const curso = await cursoService.obtenerCursoPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: curso
  });
});

export const crearCurso = manejadorAsync(async (req, res) => {
  const curso = await cursoService.crearCurso(req.body);

  res.status(201).json({
    success: true,
    message: 'Curso creado correctamente.',
    data: curso
  });
});

export const actualizarCurso = manejadorAsync(async (req, res) => {
  const curso = await cursoService.actualizarCurso(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Curso actualizado correctamente.',
    data: curso
  });
});

export const eliminarCurso = manejadorAsync(async (req, res) => {
  const curso = await cursoService.eliminarCurso(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Curso cancelado correctamente.',
    data: curso
  });
});

export default {
  obtenerCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso
};
