import { Router } from 'express';

import {
  actualizarCurso,
  crearCurso,
  eliminarCurso,
  obtenerCursoPorId,
  obtenerCursos
} from '../controllers/curso.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validateRequest from '../middlewares/validateRequest.js';
import { validateCreateCurso, validateIdParam, validateUpdateCurso } from '../validators/curso.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerCursos);
router.get('/:id', validateIdParam, validateRequest, obtenerCursoPorId);
router.post('/', adminOnly, validateCreateCurso, validateRequest, crearCurso);
router.put('/:id', adminOnly, validateIdParam, validateUpdateCurso, validateRequest, actualizarCurso);
router.delete('/:id', adminOnly, validateIdParam, validateRequest, eliminarCurso);

export default router;
