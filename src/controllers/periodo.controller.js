import * as periodoService from '../services/periodo.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerPeriodosAcademicos = manejadorAsync(async (req, res) => {
  const resultado = await periodoService.listarPeriodosAcademicos(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerPeriodoAcademicoPorId = manejadorAsync(async (req, res) => {
  const periodo = await periodoService.obtenerPeriodoPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: periodo
  });
});

export const crearPeriodoAcademico = manejadorAsync(async (req, res) => {
  const periodo = await periodoService.crearPeriodoAcademico(req.body);

  res.status(201).json({
    success: true,
    message: 'Periodo academico creado correctamente.',
    data: periodo
  });
});

export const actualizarPeriodoAcademico = manejadorAsync(async (req, res) => {
  const periodo = await periodoService.actualizarPeriodoAcademico(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Periodo academico actualizado correctamente.',
    data: periodo
  });
});

export const cambiarEstadoPeriodoAcademico = manejadorAsync(async (req, res) => {
  const periodo = await periodoService.cambiarEstadoPeriodo(req.params.id, req.body.estado);

  res.status(200).json({
    success: true,
    message: 'Estado de periodo academico actualizado correctamente.',
    data: periodo
  });
});

export default {
  obtenerPeriodosAcademicos,
  obtenerPeriodoAcademicoPorId,
  crearPeriodoAcademico,
  actualizarPeriodoAcademico,
  cambiarEstadoPeriodoAcademico
};
