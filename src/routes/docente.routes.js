import { Router } from 'express';

import {
  actualizarDocente,
  crearDocente,
  eliminarDocente,
  obtenerDocentePorId,
  obtenerDocentes
} from '../controllers/docente.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import { validateCreateDocente, validateIdParam, validateUpdateDocente } from '../validators/docente.validator.js';

const router = Router();

router.get('/', obtenerDocentes);
router.get('/:id', validateIdParam, validateRequest, obtenerDocentePorId);
router.post('/', validateCreateDocente, validateRequest, crearDocente);
router.put('/:id', validateIdParam, validateUpdateDocente, validateRequest, actualizarDocente);
router.delete('/:id', validateIdParam, validateRequest, eliminarDocente);

export default router;
