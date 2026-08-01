import { Router } from 'express';

import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
  crearUsuario,
  obtenerUsuarioPorId,
  obtenerUsuarios
} from '../controllers/usuario.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
  validateChangeEstadoUsuario,
  validateChangePasswordUsuario,
  validateCreateUsuario,
  validateIdParam,
  validateListUsuarios,
  validateUpdateUsuario
} from '../validators/usuario.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.use(adminOnly);

router.get('/', validateListUsuarios, validateRequest, obtenerUsuarios);
router.get('/:id', validateIdParam, validateRequest, obtenerUsuarioPorId);
router.post('/', validateCreateUsuario, validateRequest, crearUsuario);
router.put('/:id', validateIdParam, validateUpdateUsuario, validateRequest, actualizarUsuario);
router.patch('/:id/estado', validateIdParam, validateChangeEstadoUsuario, validateRequest, cambiarEstadoUsuario);
router.patch('/:id/password', validateIdParam, validateChangePasswordUsuario, validateRequest, cambiarPasswordUsuario);

export default router;
