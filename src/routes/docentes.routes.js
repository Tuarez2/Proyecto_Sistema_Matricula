import { Router } from 'express';
import {
  crearDocente,
  obtenerDocentes,
  obtenerDocentePorId,
  actualizarDocente,
  eliminarDocente
} from '../controllers/docente.controller.js';

const router = Router();

router.post('/', crearDocente);
router.get('/', obtenerDocentes);
router.get('/:id', obtenerDocentePorId);
router.put('/:id', actualizarDocente);
router.delete('/:id', eliminarDocente);

export default router;