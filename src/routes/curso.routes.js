import { Router } from 'express';

import {
  actualizarCurso,
  crearCurso,
  eliminarCurso,
  obtenerCursoPorId,
  obtenerCursos
} from '../controllers/curso.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import { validateCreateCurso, validateIdParam, validateUpdateCurso } from '../validators/curso.validator.js';

const router = Router();

router.get('/', obtenerCursos);
router.get('/:id', validateIdParam, validateRequest, obtenerCursoPorId);
router.post('/', validateCreateCurso, validateRequest, crearCurso);
router.put('/:id', validateIdParam, validateUpdateCurso, validateRequest, actualizarCurso);
router.delete('/:id', validateIdParam, validateRequest, eliminarCurso);

export default router;
