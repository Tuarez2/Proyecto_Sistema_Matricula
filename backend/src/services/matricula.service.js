import { Op, UniqueConstraintError } from 'sequelize';

import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  ESTADOS_MATRICULA_OCUPAN_CUPO,
  ROLE_CODES
} from '../constants/domain.constants.js';
import {
  Asignatura,
  Carrera,
  CarreraAsignatura,
  Curso,
  Docente,
  Estudiante,
  Matricula,
  PeriodoAcademico,
  Usuario,
  sequelize
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { construirLimiteFinDia, construirLimiteInicioDia } from '../utils/fechas.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const camposPermitidosCreacion = ['estudiante_id', 'curso_id'];
const ESTADO_INICIAL_MATRICULA = ENROLLMENT_STATUS.ENROLLED;
const ESTADOS_ESTUDIANTE_HABILITADOS = [ACADEMIC_STATUS.ACTIVE];
const ESTADOS_PERIODO_PERMITEN_MATRICULA = [ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN];
const ESTADOS_CURSO_PERMITEN_MATRICULA = [COURSE_STATUS.OPEN];
const ROLES_GESTION_MATRICULA = [ROLE_CODES.ADMIN, ROLE_CODES.ENROLLMENT_MANAGER];

const esRolGestionMatricula = (codigoRol) => ROLES_GESTION_MATRICULA.includes(codigoRol);

const transicionesPermitidas = {
  [ENROLLMENT_STATUS.ENROLLED]: [
    ENROLLMENT_STATUS.CANCELLED,
    ENROLLMENT_STATUS.WITHDRAWN,
    ENROLLMENT_STATUS.PASSED,
    ENROLLMENT_STATUS.FAILED
  ],
  [ENROLLMENT_STATUS.PASSED]: [],
  [ENROLLMENT_STATUS.FAILED]: [],
  [ENROLLMENT_STATUS.WITHDRAWN]: [],
  [ENROLLMENT_STATUS.CANCELLED]: []
};

const atributosCarrera = ['id', 'codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];
const atributosEstudiante = [
  'id',
  'numero_matricula',
  'nombres',
  'apellidos',
  'identificacion',
  'correo',
  'estado_academico',
  'nivel_academico_actual',
  'carrera_id'
];
const atributosAsignatura = ['id', 'codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];
const atributosDocente = ['id', 'identificacion', 'nombres', 'apellidos', 'correo', 'especialidad', 'activo'];
const atributosPeriodo = [
  'id',
  'codigo',
  'nombre',
  'fecha_inicio',
  'fecha_fin',
  'fecha_inicio_matricula',
  'fecha_fin_matricula',
  'estado'
];
const atributosCurso = [
  'id',
  'periodo_id',
  'asignatura_id',
  'docente_id',
  'paralelo',
  'aula',
  'horario',
  'cupo_maximo',
  'estado'
];

const inclusionEstudiante = {
  model: Estudiante,
  as: 'estudiante',
  attributes: atributosEstudiante,
  include: [{ model: Carrera, as: 'carrera', attributes: atributosCarrera }]
};

const inclusionCurso = {
  model: Curso,
  as: 'curso',
  attributes: atributosCurso,
  include: [
    { model: Asignatura, as: 'asignatura', attributes: atributosAsignatura },
    { model: Docente, as: 'docente', attributes: atributosDocente },
    { model: PeriodoAcademico, as: 'periodoAcademico', attributes: atributosPeriodo }
  ]
};

const seleccionarDatosPermitidos = (datos, camposPermitidos) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(datos, campo) && datos[campo] !== undefined) {
      datosPermitidos[campo] = datos[campo];
    }
    return datosPermitidos;
  }, {});

const obtenerDatosPlano = (registro) => {
  if (!registro) return null;
  return typeof registro.get === 'function' ? registro.get({ plain: true }) : registro;
};

const sanitizarCarrera = (carrera) => {
  const carreraPlano = obtenerDatosPlano(carrera);
  if (!carreraPlano) return undefined;

  return {
    id: carreraPlano.id,
    codigo: carreraPlano.codigo,
    nombre: carreraPlano.nombre,
    duracion_semestres: carreraPlano.duracion_semestres,
    facultad_id: carreraPlano.facultad_id,
    activo: carreraPlano.activo
  };
};

const sanitizarEstudiante = (estudiante, minimizarDatosPersonales = false) => {
  const estudiantePlano = obtenerDatosPlano(estudiante);
  if (!estudiantePlano) return undefined;

  const datosBase = {
    id: estudiantePlano.id,
    numero_matricula: estudiantePlano.numero_matricula,
    nombres: estudiantePlano.nombres,
    apellidos: estudiantePlano.apellidos,
    estado_academico: estudiantePlano.estado_academico,
    nivel_academico_actual: estudiantePlano.nivel_academico_actual,
    carrera_id: estudiantePlano.carrera_id,
    carrera: sanitizarCarrera(estudiantePlano.carrera)
  };

  if (minimizarDatosPersonales) {
    return datosBase;
  }

  return {
    ...datosBase,
    identificacion: estudiantePlano.identificacion,
    correo: estudiantePlano.correo
  };
};

const sanitizarAsignatura = (asignatura) => {
  const asignaturaPlano = obtenerDatosPlano(asignatura);
  if (!asignaturaPlano) return undefined;

  return {
    id: asignaturaPlano.id,
    codigo: asignaturaPlano.codigo,
    nombre: asignaturaPlano.nombre,
    creditos: asignaturaPlano.creditos,
    nivel_academico: asignaturaPlano.nivel_academico,
    activo: asignaturaPlano.activo
  };
};

const sanitizarDocente = (docente, minimizarDatosPersonales = false) => {
  const docentePlano = obtenerDatosPlano(docente);
  if (!docentePlano) return undefined;

  const datosBase = {
    id: docentePlano.id,
    nombres: docentePlano.nombres,
    apellidos: docentePlano.apellidos,
    especialidad: docentePlano.especialidad,
    activo: docentePlano.activo
  };

  if (minimizarDatosPersonales) {
    return datosBase;
  }

  return {
    ...datosBase,
    identificacion: docentePlano.identificacion,
    correo: docentePlano.correo
  };
};

const sanitizarPeriodo = (periodoAcademico) => {
  const periodoPlano = obtenerDatosPlano(periodoAcademico);
  if (!periodoPlano) return undefined;

  return {
    id: periodoPlano.id,
    codigo: periodoPlano.codigo,
    nombre: periodoPlano.nombre,
    fecha_inicio: periodoPlano.fecha_inicio,
    fecha_fin: periodoPlano.fecha_fin,
    fecha_inicio_matricula: periodoPlano.fecha_inicio_matricula,
    fecha_fin_matricula: periodoPlano.fecha_fin_matricula,
    estado: periodoPlano.estado
  };
};

const sanitizarCurso = (curso, minimizarDatosPersonales = false) => {
  const cursoPlano = obtenerDatosPlano(curso);
  if (!cursoPlano) return undefined;

  return {
    id: cursoPlano.id,
    periodo_id: cursoPlano.periodo_id,
    asignatura_id: cursoPlano.asignatura_id,
    docente_id: cursoPlano.docente_id,
    paralelo: cursoPlano.paralelo,
    aula: cursoPlano.aula,
    horario: cursoPlano.horario,
    cupo_maximo: cursoPlano.cupo_maximo,
    estado: cursoPlano.estado,
    asignatura: sanitizarAsignatura(cursoPlano.asignatura),
    docente: sanitizarDocente(cursoPlano.docente, minimizarDatosPersonales),
    periodoAcademico: sanitizarPeriodo(cursoPlano.periodoAcademico)
  };
};

const sanitizarMatricula = (matricula, minimizarDatosPersonales = false) => {
  const matriculaPlano = obtenerDatosPlano(matricula);
  if (!matriculaPlano) return null;

  return {
    id: matriculaPlano.id,
    estudiante_id: matriculaPlano.estudiante_id,
    curso_id: matriculaPlano.curso_id,
    fecha_matricula: matriculaPlano.fecha_matricula,
    estado: matriculaPlano.estado,
    calificacion_final: matriculaPlano.calificacion_final,
    created_at: matriculaPlano.created_at,
    updated_at: matriculaPlano.updated_at,
    estudiante: sanitizarEstudiante(matriculaPlano.estudiante, minimizarDatosPersonales),
    curso: sanitizarCurso(matriculaPlano.curso, minimizarDatosPersonales)
  };
};

const fechaValida = (valor) => {
  const fecha = new Date(valor);
  return fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? fecha : null;
};

const construirFiltrosMatricula = (filtros = {}) => {
  const condiciones = {};
  const condicionesCurso = {};
  const condicionesEstudiante = {};

  ['estudiante_id', 'curso_id', 'estado'].forEach((campo) => {
    if (filtros[campo] !== undefined) {
      condiciones[campo] = filtros[campo];
    }
  });

  if (filtros.fecha_desde) {
    condiciones.fecha_matricula = {
      ...(condiciones.fecha_matricula ?? {}),
      [Op.gte]: construirLimiteInicioDia(filtros.fecha_desde)
    };
  }

  if (filtros.fecha_hasta) {
    condiciones.fecha_matricula = {
      ...(condiciones.fecha_matricula ?? {}),
      [Op.lte]: construirLimiteFinDia(filtros.fecha_hasta)
    };
  }

  if (filtros.periodo_id !== undefined) {
    condicionesCurso.periodo_id = filtros.periodo_id;
  }

  if (filtros.asignatura_id !== undefined) {
    condicionesCurso.asignatura_id = filtros.asignatura_id;
  }

  if (filtros.carrera_id !== undefined) {
    condicionesEstudiante.carrera_id = filtros.carrera_id;
  }

  return { condiciones, condicionesCurso, condicionesEstudiante };
};

const contarMatriculasQueOcupanCupo = (cursoId, opciones = {}) =>
  Matricula.count({
    where: {
      curso_id: cursoId,
      estado: { [Op.in]: ESTADOS_MATRICULA_OCUPAN_CUPO }
    },
    transaction: opciones.transaction
  });

const obtenerMatriculaExistente = async (matriculaId, opciones = {}) => {
  const matricula = await Matricula.findByPk(matriculaId, {
    include: opciones.include,
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!matricula) {
    throw new ApiError(404, 'Matricula no encontrada.', 'MATRICULA_NOT_FOUND');
  }

  return matricula;
};

const obtenerMatriculaDetalle = (matriculaId, opciones = {}) =>
  obtenerMatriculaExistente(matriculaId, {
    include: [inclusionEstudiante, inclusionCurso],
    transaction: opciones.transaction
  });

const obtenerEstudianteIdDelUsuario = async (usuarioId) => {
  const usuario = await Usuario.findByPk(usuarioId, { attributes: ['id', 'estudiante_id'] });

  if (!usuario?.estudiante_id) {
    throw new ApiError(403, 'No tiene permisos para consultar matriculas.', 'FORBIDDEN');
  }

  return usuario.estudiante_id;
};

const asegurarRolConsultaMatriculas = (codigoRol) => {
  if (!esRolGestionMatricula(codigoRol) && codigoRol !== ROLE_CODES.STUDENT) {
    throw new ApiError(403, 'No tiene permisos para consultar matriculas.', 'FORBIDDEN');
  }
};

const verificarEstudianteHabilitado = async (estudianteId, opciones = {}) => {
  const estudiante = await Estudiante.findByPk(estudianteId, {
    include: [{ model: Carrera, as: 'carrera', attributes: atributosCarrera }],
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  if (!estudiante.carrera_id || !estudiante.carrera) {
    throw new ApiError(409, 'El estudiante no tiene una carrera activa asociada.', 'ESTUDIANTE_SIN_CARRERA');
  }

  if (!estudiante.carrera.activo) {
    throw new ApiError(409, 'La carrera del estudiante no esta activa.', 'CARRERA_INACTIVA');
  }

  if (!ESTADOS_ESTUDIANTE_HABILITADOS.includes(estudiante.estado_academico)) {
    throw new ApiError(
      409,
      'El estado academico del estudiante no permite matricula.',
      'ESTUDIANTE_NO_HABILITADO'
    );
  }

  return estudiante;
};

const verificarPeriodoDeMatricula = (periodoAcademico) => {
  if (!periodoAcademico) {
    throw new ApiError(404, 'Periodo academico no encontrado.', 'PERIODO_ACADEMICO_NOT_FOUND');
  }

  if (!ESTADOS_PERIODO_PERMITEN_MATRICULA.includes(periodoAcademico.estado)) {
    throw new ApiError(
      409,
      'El periodo academico no permite registrar matriculas.',
      'PERIODO_NO_PERMITE_MATRICULA'
    );
  }

  const fechaActual = new Date();
  const inicioMatricula = fechaValida(periodoAcademico.fecha_inicio_matricula);
  const finMatricula = fechaValida(periodoAcademico.fecha_fin_matricula);

  if (!inicioMatricula || !finMatricula || fechaActual < inicioMatricula || fechaActual > finMatricula) {
    throw new ApiError(
      409,
      'La fecha actual esta fuera de la ventana de matricula del periodo academico.',
      'PERIODO_FUERA_DE_VENTANA_MATRICULA'
    );
  }
};

const verificarCursoHabilitado = async (cursoId, opciones = {}) => {
  const curso = await Curso.findByPk(cursoId, {
    include: [
      { model: Asignatura, as: 'asignatura', attributes: atributosAsignatura },
      { model: Docente, as: 'docente', attributes: atributosDocente },
      { model: PeriodoAcademico, as: 'periodoAcademico', attributes: atributosPeriodo }
    ],
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  if (!ESTADOS_CURSO_PERMITEN_MATRICULA.includes(curso.estado)) {
    throw new ApiError(409, 'El curso no esta disponible para matriculas.', 'CURSO_NO_DISPONIBLE');
  }

  if (!Number.isInteger(curso.cupo_maximo) || curso.cupo_maximo <= 0) {
    throw new ApiError(409, 'El curso no tiene un cupo maximo valido.', 'CURSO_CUPO_INVALIDO');
  }

  if (!curso.asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  if (!curso.asignatura.activo) {
    throw new ApiError(409, 'La asignatura del curso esta inactiva.', 'ASIGNATURA_INACTIVA');
  }

  if (!curso.docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  if (!curso.docente.activo) {
    throw new ApiError(409, 'El docente del curso esta inactivo.', 'DOCENTE_INACTIVO');
  }

  verificarPeriodoDeMatricula(curso.periodoAcademico);

  return curso;
};

const verificarAsignaturaEnMalla = async (estudiante, curso, opciones = {}) => {
  const asignacionCurricular = await CarreraAsignatura.findOne({
    where: {
      carrera_id: estudiante.carrera_id,
      asignatura_id: curso.asignatura_id
    },
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!asignacionCurricular) {
    throw new ApiError(
      409,
      'La asignatura del curso no pertenece a la malla curricular del estudiante.',
      'ASIGNATURA_FUERA_DE_MALLA'
    );
  }
};

const verificarMatriculaDuplicada = async (estudianteId, cursoId, opciones = {}) => {
  const matriculaExistente = await Matricula.findOne({
    where: {
      estudiante_id: estudianteId,
      curso_id: cursoId
    },
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (matriculaExistente) {
    throw new ApiError(
      409,
      'El estudiante ya tiene una matricula registrada para este curso.',
      'MATRICULA_DUPLICADA'
    );
  }
};

const verificarCupoDisponible = async (curso, opciones = {}) => {
  const cantidadMatriculados = await contarMatriculasQueOcupanCupo(curso.id, opciones);

  if (cantidadMatriculados >= curso.cupo_maximo) {
    throw new ApiError(409, 'El curso no tiene cupos disponibles.', 'CURSO_SIN_CUPOS');
  }
};

const asegurarTransicionPermitida = (estadoActual, estadoSiguiente) => {
  if (estadoActual === estadoSiguiente) return;

  if (!transicionesPermitidas[estadoActual]?.includes(estadoSiguiente)) {
    throw new ApiError(
      409,
      'La transicion de estado de la matricula no esta permitida.',
      'MATRICULA_TRANSICION_INVALIDA',
      { estadoActual, estadoSiguiente }
    );
  }
};

export const listarMatriculas = async (filtros = {}, usuario) => {
  const codigoRol = usuario?.rol?.codigo;
  asegurarRolConsultaMatriculas(codigoRol);

  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);
  const { condiciones, condicionesCurso, condicionesEstudiante } = construirFiltrosMatricula(filtros);
  const minimizarDatosPersonales = !esRolGestionMatricula(codigoRol);

  if (codigoRol === ROLE_CODES.STUDENT) {
    condiciones.estudiante_id = await obtenerEstudianteIdDelUsuario(usuario.id);
  }

  const filtraCurso = Object.keys(condicionesCurso).length > 0;
  const filtraEstudiante = Object.keys(condicionesEstudiante).length > 0;

  const { rows: registros, count: totalRegistros } = await Matricula.findAndCountAll({
    where: condiciones,
    include: [
      {
        ...inclusionEstudiante,
        where: filtraEstudiante ? condicionesEstudiante : undefined,
        required: filtraEstudiante
      },
      {
        ...inclusionCurso,
        where: filtraCurso ? condicionesCurso : undefined,
        required: filtraCurso
      }
    ],
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['fecha_matricula', 'DESC'],
      ['id', 'DESC']
    ]
  });

  return {
    data: registros.map((registro) => sanitizarMatricula(registro, minimizarDatosPersonales)),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerMatriculaPorId = async (id, usuario) => {
  const matricula = await obtenerMatriculaDetalle(id);
  const codigoRol = usuario?.rol?.codigo;

  if (codigoRol === ROLE_CODES.STUDENT) {
    const estudianteId = await obtenerEstudianteIdDelUsuario(usuario.id);

    if (matricula.estudiante_id !== estudianteId) {
      throw new ApiError(404, 'Matricula no encontrada.', 'MATRICULA_NOT_FOUND');
    }

    return sanitizarMatricula(matricula, true);
  }

  asegurarRolConsultaMatriculas(codigoRol);

  return sanitizarMatricula(matricula, false);
};

export const crearMatricula = async (datos, usuario) => {
  try {
    const matriculaId = await sequelize.transaction(async (transaction) => {
      const datosMatricula = seleccionarDatosPermitidos(datos, camposPermitidosCreacion);
      const estudiante = await verificarEstudianteHabilitado(datosMatricula.estudiante_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const curso = await verificarCursoHabilitado(datosMatricula.curso_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      await verificarAsignaturaEnMalla(estudiante, curso, { transaction, lock: transaction.LOCK.UPDATE });
      await verificarMatriculaDuplicada(estudiante.id, curso.id, { transaction, lock: transaction.LOCK.UPDATE });
      await verificarCupoDisponible(curso, { transaction });

      const matricula = await Matricula.create(
        {
          estudiante_id: estudiante.id,
          curso_id: curso.id,
          estado: ESTADO_INICIAL_MATRICULA
        },
        { transaction }
      );

      return matricula.id;
    });

    return obtenerMatriculaPorId(matriculaId, usuario);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ApiError(
        409,
        'El estudiante ya tiene una matricula registrada para este curso.',
        'MATRICULA_DUPLICADA'
      );
    }

    throw error;
  }
};

export const cambiarEstadoMatricula = async (id, estado, usuario) => {
  const matriculaId = await sequelize.transaction(async (transaction) => {
    const matricula = await obtenerMatriculaExistente(id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (matricula.estado === estado) {
      return matricula.id;
    }

    asegurarTransicionPermitida(matricula.estado, estado);

    await matricula.update({ estado }, { transaction });

    return matricula.id;
  });

  return obtenerMatriculaPorId(matriculaId, usuario);
};

export default {
  listarMatriculas,
  obtenerMatriculaPorId,
  crearMatricula,
  cambiarEstadoMatricula
};
