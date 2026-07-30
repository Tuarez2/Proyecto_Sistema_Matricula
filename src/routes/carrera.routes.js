import { Router } from 'express';
import {
  crearCarrera,
  obtenerCarreras,
  obtenerCarreraPorId,
  actualizarCarrera,
  eliminarCarrera
} from '../controllers/carreraController.js';

const router = Router();

router.post('/', crearCarrera);
router.get('/', obtenerCarreras);
router.get('/:id', obtenerCarreraPorId);
router.put('/:id', actualizarCarrera);
router.delete('/:id', eliminarCarrera);

export default router;
