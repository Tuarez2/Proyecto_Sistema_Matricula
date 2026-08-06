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
  validarListadoEstudiantes,
  validarActualizacionEstudiante
} from '../validators/estudiante.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);
const rolesLectura = authorizeRoles(ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER);

router.use(authenticate);
router.get('/', rolesLectura, validarListadoEstudiantes, validarSolicitud, obtenerEstudiantes);
router.get('/:id', rolesLectura, validarIdParam, validarSolicitud, obtenerEstudiantePorId);
router.post('/', adminOnly, validarCreacionEstudiante, validarSolicitud, crearEstudiante);
router.put('/:id', adminOnly, validarIdParam, validarActualizacionEstudiante, validarSolicitud, actualizarEstudiante);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarEstudiante);

export default router;
