import * as carreraAsignaturaService from '../services/carreraAsignatura.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerAsignacionesCurriculares = manejadorAsync(async (req, res) => {
  const resultado = await carreraAsignaturaService.listarAsignacionesCurriculares(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerAsignacionCurricularPorId = manejadorAsync(async (req, res) => {
  const asignacion = await carreraAsignaturaService.obtenerAsignacionCurricularPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: asignacion
  });
});

export const obtenerAsignaturasPorCarrera = manejadorAsync(async (req, res) => {
  const resultado = await carreraAsignaturaService.listarAsignaturasDeCarrera(req.params.carreraId, req.query);

  res.status(200).json({
    success: true,
    carrera: resultado.carrera,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const crearAsignacionCurricular = manejadorAsync(async (req, res) => {
  const asignacion = await carreraAsignaturaService.crearAsignacionCurricular(req.body);

  res.status(201).json({
    success: true,
    message: 'Asignacion curricular creada correctamente.',
    data: asignacion
  });
});

export const actualizarAsignacionCurricular = manejadorAsync(async (req, res) => {
  const asignacion = await carreraAsignaturaService.actualizarAsignacionCurricular(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Asignacion curricular actualizada correctamente.',
    data: asignacion
  });
});

export const eliminarAsignacionCurricular = manejadorAsync(async (req, res) => {
  const asignacion = await carreraAsignaturaService.eliminarAsignacionCurricular(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Asignacion curricular eliminada correctamente.',
    data: asignacion
  });
});

export default {
  obtenerAsignacionesCurriculares,
  obtenerAsignacionCurricularPorId,
  obtenerAsignaturasPorCarrera,
  crearAsignacionCurricular,
  actualizarAsignacionCurricular,
  eliminarAsignacionCurricular
};
