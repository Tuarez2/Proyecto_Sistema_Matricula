import { Router } from 'express';

import {
  actualizarAsignatura,
  crearAsignatura,
  eliminarAsignatura,
  obtenerAsignaturaPorId,
  obtenerAsignaturas
} from '../controllers/asignatura.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
  validateCreateAsignatura,
  validateIdParam,
  validateUpdateAsignatura
} from '../validators/asignatura.validator.js';

const router = Router();

router.get('/', obtenerAsignaturas);
router.get('/:id', validateIdParam, validateRequest, obtenerAsignaturaPorId);
router.post('/', validateCreateAsignatura, validateRequest, crearAsignatura);
router.put('/:id', validateIdParam, validateUpdateAsignatura, validateRequest, actualizarAsignatura);
router.delete('/:id', validateIdParam, validateRequest, eliminarAsignatura);

export default router;
