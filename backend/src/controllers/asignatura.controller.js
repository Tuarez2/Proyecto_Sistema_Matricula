import * as asignaturaService from '../services/asignatura.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerAsignaturas = manejadorAsync(async (req, res) => {
  const resultado = await asignaturaService.listarAsignaturas(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerAsignaturaPorId = manejadorAsync(async (req, res) => {
  const asignatura = await asignaturaService.obtenerAsignaturaPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: asignatura
  });
});

export const crearAsignatura = manejadorAsync(async (req, res) => {
  const asignatura = await asignaturaService.crearAsignatura(req.body);

  res.status(201).json({
    success: true,
    message: 'Asignatura creada correctamente.',
    data: asignatura
  });
});

export const actualizarAsignatura = manejadorAsync(async (req, res) => {
  const asignatura = await asignaturaService.actualizarAsignatura(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Asignatura actualizada correctamente.',
    data: asignatura
  });
});

export const eliminarAsignatura = manejadorAsync(async (req, res) => {
  const asignatura = await asignaturaService.eliminarAsignatura(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Asignatura inactivada correctamente.',
    data: asignatura
  });
});

export default {
  obtenerAsignaturas,
  obtenerAsignaturaPorId,
  crearAsignatura,
  actualizarAsignatura,
  eliminarAsignatura
};
