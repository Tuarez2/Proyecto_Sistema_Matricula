import { Router } from 'express';

import {
  actualizarDocente,
  crearDocente,
  eliminarDocente,
  obtenerDocentePorId,
  obtenerDocentes
} from '../controllers/docente.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validateRequest from '../middlewares/validateRequest.js';
import { validateCreateDocente, validateIdParam, validateUpdateDocente } from '../validators/docente.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerDocentes);
router.get('/:id', validateIdParam, validateRequest, obtenerDocentePorId);
router.post('/', adminOnly, validateCreateDocente, validateRequest, crearDocente);
router.put('/:id', adminOnly, validateIdParam, validateUpdateDocente, validateRequest, actualizarDocente);
router.delete('/:id', adminOnly, validateIdParam, validateRequest, eliminarDocente);

export default router;
