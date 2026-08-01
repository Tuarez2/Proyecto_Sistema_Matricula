import * as docenteService from '../services/docente.service.js';
import manejadorAsync from '../utils/asyncHandler.js';

export const obtenerDocentes = manejadorAsync(async (req, res) => {
  const docentes = await docenteService.listarDocentes();

  res.status(200).json({
    success: true,
    data: docentes
  });
});

export const obtenerDocentePorId = manejadorAsync(async (req, res) => {
  const docente = await docenteService.obtenerDocentePorId(req.params.id);

  res.status(200).json({
    success: true,
    data: docente
  });
});

export const crearDocente = manejadorAsync(async (req, res) => {
  const docente = await docenteService.crearDocente(req.body);

  res.status(201).json({
    success: true,
    message: 'Docente creado correctamente.',
    data: docente
  });
});

export const actualizarDocente = manejadorAsync(async (req, res) => {
  const docente = await docenteService.actualizarDocente(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Docente actualizado correctamente.',
    data: docente
  });
});

export const eliminarDocente = manejadorAsync(async (req, res) => {
  const docente = await docenteService.eliminarDocente(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Docente inactivado correctamente.',
    data: docente
  });
});

export default {
  obtenerDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  eliminarDocente
};
