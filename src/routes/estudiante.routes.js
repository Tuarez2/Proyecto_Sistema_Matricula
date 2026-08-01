import { Router } from 'express';

import {
  actualizarEstudiante,
  crearEstudiante,
  eliminarEstudiante,
  obtenerEstudiantePorId,
  obtenerEstudiantes
} from '../controllers/estudiante.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
  validateCreateEstudiante,
  validateIdParam,
  validateUpdateEstudiante
} from '../validators/estudiante.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerEstudiantes);
router.get('/:id', validateIdParam, validateRequest, obtenerEstudiantePorId);
router.post('/', adminOnly, validateCreateEstudiante, validateRequest, crearEstudiante);
router.put('/:id', adminOnly, validateIdParam, validateUpdateEstudiante, validateRequest, actualizarEstudiante);
router.delete('/:id', adminOnly, validateIdParam, validateRequest, eliminarEstudiante);

export default router;
