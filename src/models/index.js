
import sequelize from '../config/database.js';

import { initDocente } from './docente.model.js';
import { initCurso } from './curso.model.js';
import { initEstudiante } from './estudiante.model.js';

export const Docente = initDocente(sequelize);
export const Curso = initCurso(sequelize);
export const Estudiante = initEstudiante(sequelize);

const models = {
  Docente,
  Curso,
  Estudiante
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;