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
import validarSolicitud from '../middlewares/validateRequest.js';
import { validarCreacionCarrera, validarIdParam, validarActualizacionCarrera } from '../validators/carrera.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerCarreras);
router.get('/:id', validarIdParam, validarSolicitud, obtenerCarreraPorId);
router.post('/', adminOnly, validarCreacionCarrera, validarSolicitud, crearCarrera);
router.put('/:id', adminOnly, validarIdParam, validarActualizacionCarrera, validarSolicitud, actualizarCarrera);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarCarrera);

export default router;
