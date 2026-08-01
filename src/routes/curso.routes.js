import { Router } from 'express';

import {
  actualizarCurso,
  crearCurso,
  eliminarCurso,
  obtenerCursoPorId,
  obtenerCursos
} from '../controllers/curso.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarActualizacionCurso,
  validarCreacionCurso,
  validarIdParam,
  validarListadoCursos
} from '../validators/curso.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);

router.use(authenticate);
router.get('/', validarListadoCursos, validarSolicitud, obtenerCursos);
router.get('/:id', validarIdParam, validarSolicitud, obtenerCursoPorId);
router.post('/', adminOnly, validarCreacionCurso, validarSolicitud, crearCurso);
router.put('/:id', adminOnly, validarIdParam, validarActualizacionCurso, validarSolicitud, actualizarCurso);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarCurso);

export default router;
