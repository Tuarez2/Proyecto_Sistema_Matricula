import { Router } from 'express';

import {
  actualizarFacultad,
  cambiarEstadoFacultad,
  crearFacultad,
  obtenerFacultadPorId,
  obtenerFacultades
} from '../controllers/facultad.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarActualizacionFacultad,
  validarCambioEstadoFacultad,
  validarCreacionFacultad,
  validarIdFacultad,
  validarListadoFacultades
} from '../validators/facultad.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);

router.get('/', validarListadoFacultades, validarSolicitud, obtenerFacultades);
router.get('/:id', validarIdFacultad, validarSolicitud, obtenerFacultadPorId);
router.post('/', adminOnly, validarCreacionFacultad, validarSolicitud, crearFacultad);
router.put('/:id', adminOnly, validarIdFacultad, validarActualizacionFacultad, validarSolicitud, actualizarFacultad);
router.patch('/:id/estado', adminOnly, validarIdFacultad, validarCambioEstadoFacultad, validarSolicitud, cambiarEstadoFacultad);

export default router;
