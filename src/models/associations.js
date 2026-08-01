let associationsInitialized = false;

const configureAssociations = (models) => {
  if (associationsInitialized) return;

  const {
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
  } = models;

  Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
  Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

  Usuario.hasMany(Sesion, { foreignKey: 'usuario_id', as: 'sesiones' });
  Sesion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

  Facultad.hasMany(Carrera, { foreignKey: 'facultad_id', as: 'carreras' });
  Carrera.belongsTo(Facultad, { foreignKey: 'facultad_id', as: 'facultad' });

  Carrera.hasMany(Estudiante, { foreignKey: 'carrera_id', as: 'estudiantes' });
  Estudiante.belongsTo(Carrera, { foreignKey: 'carrera_id', as: 'carrera' });

  Estudiante.hasOne(Usuario, { foreignKey: 'estudiante_id', as: 'usuario' });
  Usuario.belongsTo(Estudiante, { foreignKey: 'estudiante_id', as: 'estudiante' });

  Docente.hasOne(Usuario, { foreignKey: 'docente_id', as: 'usuario' });
  Usuario.belongsTo(Docente, { foreignKey: 'docente_id', as: 'docente' });

  Carrera.belongsToMany(Asignatura, {
    through: CarreraAsignatura,
    foreignKey: 'carrera_id',
    otherKey: 'asignatura_id',
    as: 'asignaturas'
  });
  Asignatura.belongsToMany(Carrera, {
    through: CarreraAsignatura,
    foreignKey: 'asignatura_id',
    otherKey: 'carrera_id',
    as: 'carreras'
  });
  CarreraAsignatura.belongsTo(Carrera, { foreignKey: 'carrera_id', as: 'carrera' });
  CarreraAsignatura.belongsTo(Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });

  Docente.hasMany(Curso, { foreignKey: 'docente_id', as: 'cursos' });
  Curso.belongsTo(Docente, { foreignKey: 'docente_id', as: 'docente' });

  Asignatura.hasMany(Curso, { foreignKey: 'asignatura_id', as: 'cursos' });
  Curso.belongsTo(Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });

  PeriodoAcademico.hasMany(Curso, { foreignKey: 'periodo_id', as: 'cursos' });
  Curso.belongsTo(PeriodoAcademico, { foreignKey: 'periodo_id', as: 'periodoAcademico' });

  Estudiante.hasMany(Matricula, { foreignKey: 'estudiante_id', as: 'matriculas' });
  Matricula.belongsTo(Estudiante, { foreignKey: 'estudiante_id', as: 'estudiante' });

  Curso.hasMany(Matricula, { foreignKey: 'curso_id', as: 'matriculas' });
  Matricula.belongsTo(Curso, { foreignKey: 'curso_id', as: 'curso' });

  Estudiante.belongsToMany(Curso, {
    through: Matricula,
    foreignKey: 'estudiante_id',
    otherKey: 'curso_id',
    as: 'cursosMatriculados'
  });
  Curso.belongsToMany(Estudiante, {
    through: Matricula,
    foreignKey: 'curso_id',
    otherKey: 'estudiante_id',
    as: 'estudiantesMatriculados'
  });

  associationsInitialized = true;
};

export default configureAssociations;
