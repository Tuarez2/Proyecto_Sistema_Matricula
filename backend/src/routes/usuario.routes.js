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
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarCambioEstadoUsuario,
  validarCambioPasswordUsuario,
  validarCreacionUsuario,
  validarIdParam,
  validarListadoUsuarios,
  validarActualizacionUsuario
} from '../validators/usuario.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.use(adminOnly);

router.get('/', validarListadoUsuarios, validarSolicitud, obtenerUsuarios);
router.get('/:id', validarIdParam, validarSolicitud, obtenerUsuarioPorId);
router.post('/', validarCreacionUsuario, validarSolicitud, crearUsuario);
router.put('/:id', validarIdParam, validarActualizacionUsuario, validarSolicitud, actualizarUsuario);
router.patch('/:id/estado', validarIdParam, validarCambioEstadoUsuario, validarSolicitud, cambiarEstadoUsuario);
router.patch('/:id/password', validarIdParam, validarCambioPasswordUsuario, validarSolicitud, cambiarPasswordUsuario);

export default router;
