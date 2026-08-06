import * as matriculaService from '../services/matricula.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerMatriculas = manejadorAsync(async (req, res) => {
  const resultado = await matriculaService.listarMatriculas(req.query, req.user);

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
  const matricula = await matriculaService.obtenerMatriculaPorId(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: matricula
  });
});

export const crearMatricula = manejadorAsync(async (req, res) => {
  const matricula = await matriculaService.crearMatricula(req.body, req.user);

  res.status(201).json({
    success: true,
    message: 'Matricula creada correctamente.',
    data: matricula
  });
});

export const crearMatriculasLote = manejadorAsync(async (req, res) => {
  const resultado = await matriculaService.crearMatriculasLote(req.body, req.user);

  res.status(201).json({
    success: true,
    message: 'Matricula registrada correctamente',
    data: resultado
  });
});

export const obtenerResumenMatriculas = manejadorAsync(async (req, res) => {
  const resumen = await matriculaService.obtenerResumenMatriculas();

  res.status(200).json({
    success: true,
    data: resumen
  });
});

export const cambiarEstadoMatricula = manejadorAsync(async (req, res) => {
  const matricula = await matriculaService.cambiarEstadoMatricula(req.params.id, req.body.estado, req.user);

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
  crearMatriculasLote,
  obtenerResumenMatriculas,
  cambiarEstadoMatricula
};
