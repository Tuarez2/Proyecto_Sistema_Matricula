import { Op } from 'sequelize';

import {
  ACADEMIC_PERIOD_STATUS,
  COURSE_STATUS,
  ESTADOS_MATRICULA_OCUPAN_CUPO
} from '../constants/domain.constants.js';
import { Asignatura, Curso, Docente, Matricula, PeriodoAcademico, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const camposPermitidos = [
  'periodo_id',
  'asignatura_id',
  'docente_id',
  'paralelo',
  'aula',
  'horario',
  'cupo_maximo',
  'estado'
];

const estadosPeriodoGestionCursos = [
  ACADEMIC_PERIOD_STATUS.PLANNED,
  ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN,
  ACADEMIC_PERIOD_STATUS.IN_PROGRESS
];

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

const atributosAsignatura = ['id', 'codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];

const atributosDocente = ['id', 'identificacion', 'nombres', 'apellidos', 'correo', 'especialidad', 'activo'];

const inclusionesListado = [
  { association: 'asignatura', attributes: atributosAsignatura },
  { association: 'docente', attributes: atributosDocente },
  { association: 'periodoAcademico', attributes: atributosPeriodo }
];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

const normalizarDatosCurso = (datosCurso) => {
  const datosNormalizados = { ...datosCurso };

  ['paralelo', 'aula', 'horario'].forEach((campo) => {
    if (typeof datosNormalizados[campo] === 'string') {
      datosNormalizados[campo] = datosNormalizados[campo].trim();
    }
  });

  return datosNormalizados;
};

const obtenerDatosPlano = (registro) => {
  if (!registro) {
    return null;
  }

  return typeof registro.get === 'function' ? registro.get({ plain: true }) : registro;
};

const sanitizarReferencia = (referencia) => {
  const datosReferencia = obtenerDatosPlano(referencia);

  if (!datosReferencia) {
    return null;
  }

  return datosReferencia;
};

const sanitizarCurso = (curso, ocupacion = null) => {
  const datosCurso = obtenerDatosPlano(curso);

  if (!datosCurso) {
    return null;
  }

  const cursoSanitizado = {
    id: datosCurso.id,
    periodo_id: datosCurso.periodo_id,
    asignatura_id: datosCurso.asignatura_id,
    docente_id: datosCurso.docente_id,
    paralelo: datosCurso.paralelo,
    aula: datosCurso.aula,
    horario: datosCurso.horario,
    cupo_maximo: datosCurso.cupo_maximo,
    estado: datosCurso.estado,
    created_at: datosCurso.created_at,
    updated_at: datosCurso.updated_at
  };

  if (datosCurso.periodoAcademico) {
    cursoSanitizado.periodoAcademico = sanitizarReferencia(datosCurso.periodoAcademico);
  }

  if (datosCurso.asignatura) {
    cursoSanitizado.asignatura = sanitizarReferencia(datosCurso.asignatura);
  }

  if (datosCurso.docente) {
    cursoSanitizado.docente = sanitizarReferencia(datosCurso.docente);
  }

  if (ocupacion !== null) {
    cursoSanitizado.cantidad_matriculados = ocupacion;
    cursoSanitizado.cupos_disponibles = Math.max(datosCurso.cupo_maximo - ocupacion, 0);
  }

  return cursoSanitizado;
};

const construirFiltrosCurso = (filtros) => {
  const where = {};

  ['periodo_id', 'asignatura_id', 'docente_id', 'estado'].forEach((campo) => {
    if (filtros[campo] !== undefined) {
      where[campo] = filtros[campo];
    }
  });

  if (filtros.paralelo) {
    where.paralelo = { [Op.like]: `%${filtros.paralelo.trim()}%` };
  }

  return where;
};

const contarMatriculasQueOcupanCupo = (cursoId, opciones = {}) =>
  Matricula.count({
    where: {
      curso_id: cursoId,
      estado: { [Op.in]: ESTADOS_MATRICULA_OCUPAN_CUPO }
    },
    transaction: opciones.transaction
  });

const contarMatriculasPorCurso = async (cursoIds, opciones = {}) => {
  const identificadores = cursoIds.filter((cursoId) => cursoId !== undefined && cursoId !== null);

  if (identificadores.length === 0) {
    return new Map();
  }

  const conteos = await Matricula.findAll({
    attributes: ['curso_id', [sequelize.fn('COUNT', sequelize.col('matricula.id')), 'cantidad']],
    where: {
      curso_id: { [Op.in]: identificadores },
      estado: { [Op.in]: ESTADOS_MATRICULA_OCUPAN_CUPO }
    },
    group: ['curso_id'],
    raw: true,
    transaction: opciones.transaction
  });

  return new Map(conteos.map((conteo) => [conteo.curso_id, Number(conteo.cantidad)]));
};

const obtenerCursoExistente = async (cursoId, opciones = {}) => {
  const curso = await Curso.findByPk(cursoId, {
    include: opciones.include,
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  return curso;
};

const verificarPeriodoHabilitadoParaCurso = async (periodoId, opciones = {}) => {
  const periodoAcademico = await PeriodoAcademico.findByPk(periodoId, {
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!periodoAcademico) {
    throw new ApiError(404, 'El periodo academico especificado no existe.', 'PERIODO_ACADEMICO_NOT_FOUND');
  }

  if (!estadosPeriodoGestionCursos.includes(periodoAcademico.estado)) {
    throw new ApiError(
      409,
      'El periodo academico no permite gestionar cursos.',
      'PERIODO_ACADEMICO_NO_HABILITADO'
    );
  }

  return periodoAcademico;
};

const verificarAsignaturaActiva = async (asignaturaId, opciones = {}) => {
  const asignatura = await Asignatura.findByPk(asignaturaId, {
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!asignatura) {
    throw new ApiError(404, 'La asignatura especificada no existe.', 'ASIGNATURA_NOT_FOUND');
  }

  if (!asignatura.activo) {
    throw new ApiError(409, 'La asignatura especificada esta inactiva.', 'ASIGNATURA_INACTIVA');
  }

  return asignatura;
};

const verificarDocenteActivo = async (docenteId, opciones = {}) => {
  const docente = await Docente.findByPk(docenteId, {
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (!docente) {
    throw new ApiError(404, 'El docente especificado no existe.', 'DOCENTE_NOT_FOUND');
  }

  if (!docente.activo) {
    throw new ApiError(409, 'El docente especificado esta inactivo.', 'DOCENTE_INACTIVO');
  }

  return docente;
};

const verificarReferenciasCurso = async (datosCurso, opciones = {}) => {
  await Promise.all([
    verificarPeriodoHabilitadoParaCurso(datosCurso.periodo_id, opciones),
    verificarAsignaturaActiva(datosCurso.asignatura_id, opciones),
    verificarDocenteActivo(datosCurso.docente_id, opciones)
  ]);
};

const verificarCursoDuplicado = async (datosCurso, cursoIdExcluido = null, opciones = {}) => {
  const where = {
    periodo_id: datosCurso.periodo_id,
    asignatura_id: datosCurso.asignatura_id,
    paralelo: datosCurso.paralelo
  };

  if (cursoIdExcluido) {
    where.id = { [Op.ne]: cursoIdExcluido };
  }

  const cursoDuplicado = await Curso.findOne({
    where,
    transaction: opciones.transaction,
    lock: opciones.lock
  });

  if (cursoDuplicado) {
    throw new ApiError(
      409,
      'Ya existe un curso con el mismo periodo, asignatura y paralelo.',
      'CURSO_DUPLICADO'
    );
  }
};

const verificarEstadoCurso = async (estadoActual, datosCurso, opciones = {}) => {
  if (!datosCurso.estado || datosCurso.estado === estadoActual) {
    return;
  }

  if (estadoActual === COURSE_STATUS.CANCELLED) {
    throw new ApiError(409, 'No se puede modificar un curso cancelado.', 'CURSO_CANCELADO_NO_MODIFICABLE');
  }

  if (datosCurso.estado === COURSE_STATUS.OPEN) {
    await verificarReferenciasCurso(datosCurso, opciones);
  }
};

const verificarCursoModificable = (curso, datosPermitidos) => {
  const soloConfirmaCancelacion =
    Object.keys(datosPermitidos).length === 1 && datosPermitidos.estado === COURSE_STATUS.CANCELLED;

  if (curso.estado === COURSE_STATUS.CANCELLED && !soloConfirmaCancelacion) {
    throw new ApiError(409, 'No se puede modificar un curso cancelado.', 'CURSO_CANCELADO_NO_MODIFICABLE');
  }
};

const verificarCupoCurso = async (cursoId, cupoMaximo, opciones = {}) => {
  if (cupoMaximo === undefined) {
    return;
  }

  const cantidadMatriculados = await contarMatriculasQueOcupanCupo(cursoId, opciones);

  if (Number(cupoMaximo) < cantidadMatriculados) {
    throw new ApiError(
      409,
      'El cupo maximo no puede ser menor que la cantidad de matriculas activas.',
      'CUPO_INSUFICIENTE'
    );
  }
};

const verificarCambiosConMatriculas = async (curso, datosCurso, opciones = {}) => {
  const cantidadMatriculados = await contarMatriculasQueOcupanCupo(curso.id, opciones);

  if (
    cantidadMatriculados > 0 &&
    datosCurso.periodo_id !== curso.periodo_id
  ) {
    throw new ApiError(
      409,
      'No se puede cambiar el periodo de un curso con matriculas activas.',
      'CURSO_CON_MATRICULAS'
    );
  }

  if (
    cantidadMatriculados > 0 &&
    datosCurso.asignatura_id !== curso.asignatura_id
  ) {
    throw new ApiError(
      409,
      'No se puede cambiar la asignatura de un curso con matriculas activas.',
      'CURSO_CON_MATRICULAS'
    );
  }
};

const construirDatosCompletosCurso = (curso, datosPermitidos) => ({
  periodo_id: datosPermitidos.periodo_id ?? curso.periodo_id,
  asignatura_id: datosPermitidos.asignatura_id ?? curso.asignatura_id,
  docente_id: datosPermitidos.docente_id ?? curso.docente_id,
  paralelo: datosPermitidos.paralelo ?? curso.paralelo,
  aula: datosPermitidos.aula ?? curso.aula,
  horario: datosPermitidos.horario ?? curso.horario,
  cupo_maximo: datosPermitidos.cupo_maximo ?? curso.cupo_maximo,
  estado: datosPermitidos.estado ?? curso.estado
});

export const listarCursos = async (filtros = {}) => {
  const { page, limit, offset } = normalizarPaginacion(filtros.page, filtros.limit);
  const where = construirFiltrosCurso(filtros);

  const { rows, count } = await Curso.findAndCountAll({
    where,
    include: inclusionesListado,
    distinct: true,
    order: [
      ['periodo_id', 'DESC'],
      ['asignatura_id', 'ASC'],
      ['paralelo', 'ASC'],
      ['id', 'ASC']
    ],
    limit,
    offset
  });

  const cursoIds = rows.map((curso) => curso.id);
  const ocupaciones = await contarMatriculasPorCurso(cursoIds);

  const data = rows.map((curso) => sanitizarCurso(curso, ocupaciones.get(curso.id) ?? 0));

  return {
    data,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit)
  };
};

export const obtenerCursoPorId = async (id) => {
  const curso = await obtenerCursoExistente(id, { include: inclusionesListado });
  const cantidadMatriculados = await contarMatriculasQueOcupanCupo(id);

  return sanitizarCurso(curso, cantidadMatriculados);
};

export const crearCurso = async (datos) => {
  const cursoId = await sequelize.transaction(async (transaction) => {
    const datosPermitidos = normalizarDatosCurso(seleccionarDatosPermitidos(datos));
    const datosCurso = {
      ...datosPermitidos,
      estado: datosPermitidos.estado ?? COURSE_STATUS.OPEN
    };

    await verificarReferenciasCurso(datosCurso, { transaction, lock: transaction.LOCK.UPDATE });
    await verificarCursoDuplicado(datosCurso, null, { transaction, lock: transaction.LOCK.UPDATE });

    const cursoCreado = await Curso.create(datosCurso, { transaction });

    return cursoCreado.id;
  });

  return obtenerCursoPorId(cursoId);
};

export const actualizarCurso = async (id, datos) => {
  await sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoExistente(id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const datosPermitidos = normalizarDatosCurso(seleccionarDatosPermitidos(datos));

    if (Object.keys(datosPermitidos).length === 0) {
      throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
    }

    verificarCursoModificable(curso, datosPermitidos);

    const datosCurso = construirDatosCompletosCurso(curso, datosPermitidos);

    await verificarCambiosConMatriculas(curso, datosCurso, { transaction });
    await verificarCupoCurso(curso.id, datosCurso.cupo_maximo, { transaction });
    await verificarReferenciasCurso(datosCurso, { transaction, lock: transaction.LOCK.UPDATE });
    await verificarCursoDuplicado(datosCurso, curso.id, { transaction, lock: transaction.LOCK.UPDATE });
    await verificarEstadoCurso(curso.estado, datosCurso, { transaction, lock: transaction.LOCK.UPDATE });

    await curso.update(datosPermitidos, { transaction });
  });

  return obtenerCursoPorId(id);
};

export const eliminarCurso = async (id) => {
  await sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoExistente(id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (curso.estado !== COURSE_STATUS.CANCELLED) {
      await curso.update({ estado: COURSE_STATUS.CANCELLED }, { transaction });
    }
  });

  return obtenerCursoPorId(id);
};

export default {
  listarCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso
};
