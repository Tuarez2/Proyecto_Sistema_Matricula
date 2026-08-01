import { Router } from 'express';

import {
  actualizarAsignacionCurricular,
  crearAsignacionCurricular,
  eliminarAsignacionCurricular,
  obtenerAsignacionCurricularPorId,
  obtenerAsignacionesCurriculares
} from '../controllers/carreraAsignatura.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarActualizacionAsignacion,
  validarCreacionAsignacion,
  validarIdAsignacion,
  validarListadoMallaCurricular
} from '../validators/carreraAsignatura.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);

router.get('/', validarListadoMallaCurricular, validarSolicitud, obtenerAsignacionesCurriculares);
router.get('/:id', validarIdAsignacion, validarSolicitud, obtenerAsignacionCurricularPorId);
router.post('/', adminOnly, validarCreacionAsignacion, validarSolicitud, crearAsignacionCurricular);
router.put('/:id', adminOnly, validarIdAsignacion, validarActualizacionAsignacion, validarSolicitud, actualizarAsignacionCurricular);
router.delete('/:id', adminOnly, validarIdAsignacion, validarSolicitud, eliminarAsignacionCurricular);

export default router;
