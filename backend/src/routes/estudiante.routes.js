import { Router } from 'express';

import {
  actualizarEstudiante,
  crearEstudiante,
  eliminarEstudiante,
  obtenerCursosDisponibles,
  obtenerEstudiantePorId,
  obtenerEstudiantes
} from '../controllers/estudiante.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import {
  validarCreacionEstudiante,
  validarCursosDisponiblesEstudiante,
  validarIdParam,
  validarListadoEstudiantes,
  validarActualizacionEstudiante
} from '../validators/estudiante.validator.js';

const router = Router();
const adminOnly = authorizeRoles(ROLE_CODES.ADMIN);
const rolesGestionEstudiantes = authorizeRoles(ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER);
const rolesConsultaEstudiantes = authorizeRoles(ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER);
const rolesConsultaDetalleEstudiante = authorizeRoles(ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER, ROLE_CODES.STUDENT);

router.use(authenticate);
router.get('/', rolesConsultaEstudiantes, validarListadoEstudiantes, validarSolicitud, obtenerEstudiantes);
router.get('/:id', rolesConsultaDetalleEstudiante, validarIdParam, validarSolicitud, obtenerEstudiantePorId);
router.get('/:id/cursos-disponibles', rolesGestionEstudiantes, validarIdParam, validarCursosDisponiblesEstudiante, validarSolicitud, obtenerCursosDisponibles);
router.post('/', rolesGestionEstudiantes, validarCreacionEstudiante, validarSolicitud, crearEstudiante);
router.put('/:id', rolesGestionEstudiantes, validarIdParam, validarActualizacionEstudiante, validarSolicitud, actualizarEstudiante);
router.delete('/:id', adminOnly, validarIdParam, validarSolicitud, eliminarEstudiante);

export default router;
