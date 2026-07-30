import { Router } from 'express';
import {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  actualizarEstudiante,
  eliminarEstudiante
} from '../controllers/estudiante.controller.js';

const router = Router();

router.post('/', crearEstudiante);
router.get('/', obtenerEstudiantes);
router.get('/:id', obtenerEstudiantePorId);
router.put('/:id', actualizarEstudiante);
router.delete('/:id', eliminarEstudiante);

export default router;