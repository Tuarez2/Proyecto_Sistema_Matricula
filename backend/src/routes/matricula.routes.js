import { Router } from 'express';

import {
  cambiarEstadoMatricula,
  crearMatricula,
  crearMatriculasLote,
  obtenerMatriculaPorId,
  obtenerMatriculas,
  obtenerResumenMatriculas
} from '../controllers/matricula.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarCreacionMatricula,
  validarCreacionMatriculasLote,
  validarEstadoMatricula,
  validarIdMatricula,
  validarListadoMatriculas
} from '../validators/matricula.validator.js';

const router = Router();
const rolesGestionMatricula = authorizeRoles(ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER);
const rolesConsultaMatriculas = authorizeRoles(ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER, ROLE_CODES.STUDENT);

router.use(authenticate);

router.get('/', rolesConsultaMatriculas, validarListadoMatriculas, validarSolicitud, obtenerMatriculas);
router.get('/resumen', rolesGestionMatricula, validarSolicitud, obtenerResumenMatriculas);
router.get('/:id', rolesConsultaMatriculas, validarIdMatricula, validarSolicitud, obtenerMatriculaPorId);
router.post('/', rolesGestionMatricula, validarCreacionMatricula, validarSolicitud, crearMatricula);
router.post('/lote', rolesGestionMatricula, validarCreacionMatriculasLote, validarSolicitud, crearMatriculasLote);
router.patch('/:id/estado', rolesGestionMatricula, validarIdMatricula, validarEstadoMatricula, validarSolicitud, cambiarEstadoMatricula);

export default router;
