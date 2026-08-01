import { Router } from 'express';

import {
  actualizarCarrera,
  crearCarrera,
  eliminarCarrera,
  obtenerCarreraPorId,
  obtenerCarreras
} from '../controllers/carrera.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validateRequest from '../middlewares/validateRequest.js';
import { validateCreateCarrera, validateIdParam, validateUpdateCarrera } from '../validators/carrera.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerCarreras);
router.get('/:id', validateIdParam, validateRequest, obtenerCarreraPorId);
router.post('/', adminOnly, validateCreateCarrera, validateRequest, crearCarrera);
router.put('/:id', adminOnly, validateIdParam, validateUpdateCarrera, validateRequest, actualizarCarrera);
router.delete('/:id', adminOnly, validateIdParam, validateRequest, eliminarCarrera);

export default router;
