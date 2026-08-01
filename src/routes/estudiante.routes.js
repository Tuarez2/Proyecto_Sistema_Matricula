import { Router } from 'express';

import {
  actualizarEstudiante,
  crearEstudiante,
  eliminarEstudiante,
  obtenerEstudiantePorId,
  obtenerEstudiantes
} from '../controllers/estudiante.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
  validateCreateEstudiante,
  validateIdParam,
  validateUpdateEstudiante
} from '../validators/estudiante.validator.js';

const router = Router();

router.get('/', obtenerEstudiantes);
router.get('/:id', validateIdParam, validateRequest, obtenerEstudiantePorId);
router.post('/', validateCreateEstudiante, validateRequest, crearEstudiante);
router.put('/:id', validateIdParam, validateUpdateEstudiante, validateRequest, actualizarEstudiante);
router.delete('/:id', validateIdParam, validateRequest, eliminarEstudiante);

export default router;
