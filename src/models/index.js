
import sequelize from '../config/database.js';

import { initDocente } from './docente.model.js';
import { initCurso } from './curso.model.js';
import { initEstudiante } from './estudiante.model.js';
import { initAsignatura } from './asignatura.model.js';
import { initCarrera } from './carrera.model.js';
export const Docente = initDocente(sequelize);
export const Curso = initCurso(sequelize);
export const Estudiante = initEstudiante(sequelize);
export const Asignatura = initAsignatura(sequelize);
export const Carrera = initCarrera(sequelize);
const models = {
  Docente,
  Curso,
  Estudiante,
  Asignatura,
  Carrera,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;