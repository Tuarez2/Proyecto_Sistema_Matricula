import { Router } from 'express';

import asignaturaRoutes from './asignatura.routes.js';
import authRoutes from './auth.routes.js';
import carreraAsignaturaRoutes from './carreraAsignatura.routes.js';
import carreraRoutes from './carrera.routes.js';
import cursoRoutes from './curso.routes.js';
import docenteRoutes from './docente.routes.js';
import estudianteRoutes from './estudiante.routes.js';
import facultadRoutes from './facultad.routes.js';
import matriculaRoutes from './matricula.routes.js';
import periodoRoutes from './periodo.routes.js';
import rolRoutes from './rol.routes.js';
import usuarioRoutes from './usuario.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/roles', rolRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/facultades', facultadRoutes);
router.use('/carreras', carreraRoutes);
router.use('/asignaturas', asignaturaRoutes);
router.use('/carrera-asignaturas', carreraAsignaturaRoutes);
router.use('/estudiantes', estudianteRoutes);
router.use('/docentes', docenteRoutes);
router.use('/periodos-academicos', periodoRoutes);
router.use('/cursos', cursoRoutes);
router.use('/matriculas', matriculaRoutes);

export default router;
