import { Router } from 'express';

import {
  actualizarPeriodoAcademico,
  cambiarEstadoPeriodoAcademico,
  crearPeriodoAcademico,
  obtenerPeriodoAcademicoPorId,
  obtenerPeriodosAcademicos
} from '../controllers/periodo.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarActualizacionPeriodo,
  validarCreacionPeriodo,
  validarEstadoPeriodo,
  validarIdPeriodo,
  validarListadoPeriodos
} from '../validators/periodo.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);

router.get('/', validarListadoPeriodos, validarSolicitud, obtenerPeriodosAcademicos);
router.get('/:id', validarIdPeriodo, validarSolicitud, obtenerPeriodoAcademicoPorId);
router.post('/', adminOnly, validarCreacionPeriodo, validarSolicitud, crearPeriodoAcademico);
router.put('/:id', adminOnly, validarIdPeriodo, validarActualizacionPeriodo, validarSolicitud, actualizarPeriodoAcademico);
router.patch('/:id/estado', adminOnly, validarIdPeriodo, validarEstadoPeriodo, validarSolicitud, cambiarEstadoPeriodoAcademico);

export default router;
