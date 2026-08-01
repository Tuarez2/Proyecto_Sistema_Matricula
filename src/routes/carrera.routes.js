import { Router } from 'express';

import {
  actualizarCarrera,
  crearCarrera,
  eliminarCarrera,
  obtenerCarreraPorId,
  obtenerCarreras
} from '../controllers/carrera.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import { validateCreateCarrera, validateIdParam, validateUpdateCarrera } from '../validators/carrera.validator.js';

const router = Router();

router.get('/', obtenerCarreras);
router.get('/:id', validateIdParam, validateRequest, obtenerCarreraPorId);
router.post('/', validateCreateCarrera, validateRequest, crearCarrera);
router.put('/:id', validateIdParam, validateUpdateCarrera, validateRequest, actualizarCarrera);
router.delete('/:id', validateIdParam, validateRequest, eliminarCarrera);

export default router;
