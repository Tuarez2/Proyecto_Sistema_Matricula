import { Router } from 'express';
import { Docente } from '../models/index.js';
import docenteRoutes from './docentes.routes.js';
import cursoRoutes from './curso.routes.js';
import estudianteRoutes from './estudiante.routes.js';


const router = Router();


router.use('/docentes', docenteRoutes);
router.use('/cursos', cursoRoutes);
router.use('/estudiantes', estudianteRoutes);


export default router;