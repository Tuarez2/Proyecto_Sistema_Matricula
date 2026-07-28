import sequelize from '../config/database.js';
import { initAsignatura } from './asignatura.model.js';
import { initCarrera } from './carrera.model.js';
import { initCarreraAsignatura } from './carreraAsignatura.model.js';
import { initCurso } from './curso.model.js';
import { initDocente } from './docente.model.js';
import { initEstudiante } from './estudiante.model.js';
import { initFacultad } from './facultad.model.js';
import { initMatricula } from './matricula.model.js';
import { initPeriodoAcademico } from './periodoAcademico.model.js';

const models = {
  Facultad: initFacultad(sequelize),
  Carrera: initCarrera(sequelize),
  Estudiante: initEstudiante(sequelize),
  Asignatura: initAsignatura(sequelize),
  CarreraAsignatura: initCarreraAsignatura(sequelize),
  Docente: initDocente(sequelize),
  PeriodoAcademico: initPeriodoAcademico(sequelize),
  Curso: initCurso(sequelize),
  Matricula: initMatricula(sequelize)
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export { sequelize };
export const {
  Facultad,
  Carrera,
  Estudiante,
  Asignatura,
  CarreraAsignatura,
  Docente,
  PeriodoAcademico,
  Curso,
  Matricula
} = models;

export default models;
