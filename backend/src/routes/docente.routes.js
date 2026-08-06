import { Router } from 'express';

import {
  actualizarDocente,
  crearDocente,
  eliminarDocente,
  obtenerDocentePorId,
  obtenerDocentes
} from '../controllers/docente.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import { validarCreacionDocente, validarIdParam, validarActualizacionDocente, validarListadoDocentes } from '../validators/docente.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', validarListadoDocentes, validarSolicitud, obtenerDocentes);
router.get('/:id', validarIdParam, validarSolicitud, obtenerDocentePorId);
router.post('/', adminOnly, validarCreacionDocente, validarSolicitud, crearDocente);
router.put('/:id', adminOnly, validarIdParam, validarActualizacionDocente, validarSolicitud, actualizarDocente);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarDocente);

export default router;
