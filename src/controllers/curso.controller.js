import * as cursoService from '../services/curso.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const obtenerCursos = asyncHandler(async (req, res) => {
  const cursos = await cursoService.listarCursos();

  res.status(200).json({
    success: true,
    data: cursos
  });
});

export const obtenerCursoPorId = asyncHandler(async (req, res) => {
  const curso = await cursoService.obtenerCursoPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: curso
  });
});

export const crearCurso = asyncHandler(async (req, res) => {
  const curso = await cursoService.crearCurso(req.body);

  res.status(201).json({
    success: true,
    message: 'Curso creado correctamente.',
    data: curso
  });
});

export const actualizarCurso = asyncHandler(async (req, res) => {
  const curso = await cursoService.actualizarCurso(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Curso actualizado correctamente.',
    data: curso
  });
});

export const eliminarCurso = asyncHandler(async (req, res) => {
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
