import * as matriculaService from '../services/matricula.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerMatriculas = manejadorAsync(async (req, res) => {
  const resultado = await matriculaService.listarMatriculas(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerMatriculaPorId = manejadorAsync(async (req, res) => {
  const matricula = await matriculaService.obtenerMatriculaPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: matricula
  });
});

export const crearMatricula = manejadorAsync(async (req, res) => {
  const matricula = await matriculaService.crearMatricula(req.body);

  res.status(201).json({
    success: true,
    message: 'Matricula creada correctamente.',
    data: matricula
  });
});

export const cambiarEstadoMatricula = manejadorAsync(async (req, res) => {
  const matricula = await matriculaService.cambiarEstadoMatricula(req.params.id, req.body.estado);

  res.status(200).json({
    success: true,
    message: 'Estado de matricula actualizado correctamente.',
    data: matricula
  });
});

export default {
  obtenerMatriculas,
  obtenerMatriculaPorId,
  crearMatricula,
  cambiarEstadoMatricula
};
