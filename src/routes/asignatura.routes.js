import { Router } from 'express';

import {
  actualizarAsignatura,
  crearAsignatura,
  eliminarAsignatura,
  obtenerAsignaturaPorId,
  obtenerAsignaturas
} from '../controllers/asignatura.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
  validateCreateAsignatura,
  validateIdParam,
  validateUpdateAsignatura
} from '../validators/asignatura.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerAsignaturas);
router.get('/:id', validateIdParam, validateRequest, obtenerAsignaturaPorId);
router.post('/', adminOnly, validateCreateAsignatura, validateRequest, crearAsignatura);
router.put('/:id', adminOnly, validateIdParam, validateUpdateAsignatura, validateRequest, actualizarAsignatura);
router.delete('/:id', adminOnly, validateIdParam, validateRequest, eliminarAsignatura);

export default router;
