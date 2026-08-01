import { sequelize } from '../config/database.js';
import Asignatura from './Asignatura.js';
import Carrera from './Carrera.js';
import CarreraAsignatura from './CarreraAsignatura.js';
import Curso from './Curso.js';
import Docente from './Docente.js';
import Estudiante from './Estudiante.js';
import Facultad from './Facultad.js';
import Matricula from './Matricula.js';
import PeriodoAcademico from './PeriodoAcademico.js';
import Rol from './Rol.js';
import Sesion from './Sesion.js';
import Usuario from './Usuario.js';
import configureAssociations from './associations.js';

Rol.initModel(sequelize);
Usuario.initModel(sequelize);
Sesion.initModel(sequelize);
Facultad.initModel(sequelize);
Carrera.initModel(sequelize);
Estudiante.initModel(sequelize);
Asignatura.initModel(sequelize);
CarreraAsignatura.initModel(sequelize);
Docente.initModel(sequelize);
PeriodoAcademico.initModel(sequelize);
Curso.initModel(sequelize);
Matricula.initModel(sequelize);

const models = {
  Rol,
  Usuario,
  Sesion,
  Facultad,
  Carrera,
  Estudiante,
  Asignatura,
  CarreraAsignatura,
  Docente,
  PeriodoAcademico,
  Curso,
  Matricula
};

configureAssociations(models);

export {
  sequelize,
  Rol,
  Usuario,
  Sesion,
  Facultad,
  Carrera,
  Estudiante,
  Asignatura,
  CarreraAsignatura,
  Docente,
  PeriodoAcademico,
  Curso,
  Matricula
};

export default models;
