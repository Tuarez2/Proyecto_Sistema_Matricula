import * as facultadService from '../services/facultad.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerFacultades = manejadorAsync(async (req, res) => {
  const resultado = await facultadService.listarFacultades(req.query);

  res.status(200).json({
    success: true,
    data: resultado.data,
    page: resultado.page,
    limit: resultado.limit,
    total: resultado.total,
    totalPages: resultado.totalPages
  });
});

export const obtenerFacultadPorId = manejadorAsync(async (req, res) => {
  const facultad = await facultadService.obtenerFacultadPorId(req.params.id);

  res.status(200).json({
    success: true,
    data: facultad
  });
});

export const crearFacultad = manejadorAsync(async (req, res) => {
  const facultad = await facultadService.crearFacultad(req.body);

  res.status(201).json({
    success: true,
    message: 'Facultad creada correctamente.',
    data: facultad
  });
});

export const actualizarFacultad = manejadorAsync(async (req, res) => {
  const facultad = await facultadService.actualizarFacultad(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Facultad actualizada correctamente.',
    data: facultad
  });
});

export const cambiarEstadoFacultad = manejadorAsync(async (req, res) => {
  const facultad = await facultadService.cambiarEstadoFacultad(req.params.id, req.body.activo);

  res.status(200).json({
    success: true,
    message: 'Estado de facultad actualizado correctamente.',
    data: facultad
  });
});

export default {
  obtenerFacultades,
  obtenerFacultadPorId,
  crearFacultad,
  actualizarFacultad,
  cambiarEstadoFacultad
};
