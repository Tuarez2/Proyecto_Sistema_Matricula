import { Router } from 'express';
import {
  crearAsignatura,
  obtenerAsignaturas,
  obtenerAsignaturaPorId,
  actualizarAsignatura,
  eliminarAsignatura
} from '../controllers/asignaturaController.js';

const router = Router();

router.post('/', crearAsignatura);
router.get('/', obtenerAsignaturas);
router.get('/:id', obtenerAsignaturaPorId);
router.put('/:id', actualizarAsignatura);
router.delete('/:id', eliminarAsignatura);

export default router;
