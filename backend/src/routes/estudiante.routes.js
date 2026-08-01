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
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarCreacionEstudiante,
  validarIdParam,
  validarActualizacionEstudiante
} from '../validators/estudiante.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', obtenerEstudiantes);
router.get('/:id', validarIdParam, validarSolicitud, obtenerEstudiantePorId);
router.post('/', adminOnly, validarCreacionEstudiante, validarSolicitud, crearEstudiante);
router.put('/:id', adminOnly, validarIdParam, validarActualizacionEstudiante, validarSolicitud, actualizarEstudiante);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarEstudiante);

export default router;
