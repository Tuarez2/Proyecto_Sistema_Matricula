import { Router } from 'express';
import {
  crearCurso,
  obtenerCursos,
  obtenerCursoPorId,
  actualizarCurso,
  eliminarCurso
} from '../controllers/curso.controller.js';

const router = Router();

router.post('/', crearCurso);
router.get('/', obtenerCursos);
router.get('/:id', obtenerCursoPorId);
router.put('/:id', actualizarCurso);
router.delete('/:id', eliminarCurso);

export default router;