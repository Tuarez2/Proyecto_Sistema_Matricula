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
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarCreacionAsignatura,
  validarIdParam,
  validarActualizacionAsignatura
} from '../validators/asignatura.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerAsignaturas);
router.get('/:id', validarIdParam, validarSolicitud, obtenerAsignaturaPorId);
router.post('/', adminOnly, validarCreacionAsignatura, validarSolicitud, crearAsignatura);
router.put('/:id', adminOnly, validarIdParam, validarActualizacionAsignatura, validarSolicitud, actualizarAsignatura);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarAsignatura);

export default router;
