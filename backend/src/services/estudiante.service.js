import { Op } from 'sequelize';

import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
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
  sequelize
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const camposPermitidos = [
  'carrera_id',
  'numero_matricula',
  'identificacion',
  'nombres',
  'apellidos',
  'correo',
  'telefono',
  'fecha_nacimiento',
  'estado_academico',
  'nivel_academico_actual'
];

const ESTADOS_ESTUDIANTE_HABILITADOS = [ACADEMIC_STATUS.ACTIVE];
const ESTADOS_PERIODO_PERMITEN_MATRICULA = [ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN];

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

const fechaValida = (valor) => {
  const fecha = new Date(valor);
  return fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? fecha : null;
};

const inclusionesListado = [{ association: 'carrera' }];
const inclusionesDetalle = [{ association: 'carrera' }];
const atributosEstudiante = ['id', 'carrera_id', 'numero_matricula', 'identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'fecha_nacimiento', 'estado_academico', 'nivel_academico_actual', 'created_at', 'updated_at'];
const atributosCarrera = ['id', 'codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

const asegurarCarreraExistente = async (carreraId) => {
  const carrera = await Carrera.findByPk(carreraId);

  if (!carrera) {
    throw new ApiError(400, 'La carrera especificada no existe.', 'CARRERA_NOT_FOUND');
  }
};

const construirFiltrosEstudiante = (filtros = {}) => {
  const condiciones = {};

  if (filtros.numero_matricula) {
    condiciones.numero_matricula = { [Op.like]: `%${filtros.numero_matricula.trim()}%` };
  }

  if (filtros.identificacion) {
    condiciones.identificacion = { [Op.like]: `%${filtros.identificacion.trim()}%` };
  }

  if (filtros.nombres) {
    condiciones.nombres = { [Op.like]: `%${filtros.nombres.trim()}%` };
  }

  if (filtros.apellidos) {
    condiciones.apellidos = { [Op.like]: `%${filtros.apellidos.trim()}%` };
  }

  if (filtros.correo) {
    condiciones.correo = { [Op.like]: `%${filtros.correo.trim()}%` };
  }

  if (filtros.carrera_id !== undefined) {
    condiciones.carrera_id = filtros.carrera_id;
  }

  if (filtros.estado_academico !== undefined) {
    condiciones.estado_academico = filtros.estado_academico;
  }

  if (filtros.nivel_academico_actual !== undefined) {
    condiciones.nivel_academico_actual = filtros.nivel_academico_actual;
  }

  return condiciones;
};

const sanitizarEstudiante = (estudiante) => {
  const estudiantePlano = typeof estudiante.get === 'function' ? estudiante.get({ plain: true }) : estudiante;

  return {
    id: estudiantePlano.id,
    carrera_id: estudiantePlano.carrera_id,
    numero_matricula: estudiantePlano.numero_matricula,
    identificacion: estudiantePlano.identificacion,
    nombres: estudiantePlano.nombres,
    apellidos: estudiantePlano.apellidos,
    correo: estudiantePlano.correo,
    telefono: estudiantePlano.telefono,
    fecha_nacimiento: estudiantePlano.fecha_nacimiento,
    estado_academico: estudiantePlano.estado_academico,
    nivel_academico_actual: estudiantePlano.nivel_academico_actual,
    created_at: estudiantePlano.created_at,
    updated_at: estudiantePlano.updated_at,
    carrera: estudiantePlano.carrera
      ? {
          id: estudiantePlano.carrera.id,
          codigo: estudiantePlano.carrera.codigo,
          nombre: estudiantePlano.carrera.nombre,
          duracion_semestres: estudiantePlano.carrera.duracion_semestres,
          facultad_id: estudiantePlano.carrera.facultad_id,
          activo: estudiantePlano.carrera.activo
        }
      : null
  };
};

export const listarEstudiantes = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await Estudiante.findAndCountAll({
    where: construirFiltrosEstudiante(filtros),
    attributes: atributosEstudiante,
    include: inclusionesListado,
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['apellidos', 'ASC'],
      ['nombres', 'ASC'],
      ['id', 'ASC']
    ]
  });

  return {
    data: registros.map(sanitizarEstudiante),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerEstudiantePorId = async (id, usuario) => {
  const estudiante = await Estudiante.findByPk(id, { include: inclusionesDetalle });

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  if (usuario?.rol?.codigo === ROLE_CODES.STUDENT && Number(id) !== Number(usuario.estudiante_id)) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  return sanitizarEstudiante(estudiante);
};

export const crearEstudiante = async (datos) => {
  await asegurarCarreraExistente(datos.carrera_id);
  return Estudiante.create(seleccionarDatosPermitidos(datos));
};

export const actualizarEstudiante = async (id, datos) => {
  const estudiante = await Estudiante.findByPk(id);

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  const datosPermitidos = seleccionarDatosPermitidos(datos);

  if (Object.keys(datosPermitidos).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  if (datosPermitidos.carrera_id !== undefined) {
    await asegurarCarreraExistente(datosPermitidos.carrera_id);
  }

  await estudiante.update(datosPermitidos);
  return obtenerEstudiantePorId(id);
};

export const eliminarEstudiante = async (id) => {
  const estudiante = await Estudiante.findByPk(id);

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  await estudiante.update({ estado_academico: ACADEMIC_STATUS.INACTIVE });
  return estudiante;
};

const verificarVentanaMatricula = (periodoAcademico) => {
  const fechaActual = new Date();
  const inicioMatricula = fechaValida(periodoAcademico.fecha_inicio_matricula);
  const finMatricula = fechaValida(periodoAcademico.fecha_fin_matricula);

  if (
    !inicioMatricula ||
    !finMatricula ||
    fechaActual < inicioMatricula ||
    fechaActual > finMatricula
  ) {
    throw new ApiError(
      409,
      'La fecha actual esta fuera de la ventana de matricula del periodo academico.',
      'PERIODO_FUERA_DE_VENTANA_MATRICULA'
    );
  }
};

const sanitizarCursoDisponible = (curso, cantidadMatriculados) => {
  const cursoPlano = typeof curso.get === 'function' ? curso.get({ plain: true }) : curso;
  const cuposDisponibles = Math.max(cursoPlano.cupo_maximo - cantidadMatriculados, 0);

  const cursoSanitizado = {
    id: cursoPlano.id,
    periodo_id: cursoPlano.periodo_id,
    asignatura_id: cursoPlano.asignatura_id,
    docente_id: cursoPlano.docente_id,
    paralelo: cursoPlano.paralelo,
    aula: cursoPlano.aula,
    horario: cursoPlano.horario,
    cupo_maximo: cursoPlano.cupo_maximo,
    estado: cursoPlano.estado,
    cantidad_matriculados: cantidadMatriculados,
    cupos_disponibles: cuposDisponibles,
    disponible: cuposDisponibles > 0
  };

  if (cursoPlano.periodoAcademico) {
    const periodoPlano = typeof cursoPlano.periodoAcademico.get === 'function'
      ? cursoPlano.periodoAcademico.get({ plain: true })
      : cursoPlano.periodoAcademico;
    cursoSanitizado.periodoAcademico = {
      id: periodoPlano.id,
      codigo: periodoPlano.codigo,
      nombre: periodoPlano.nombre,
      estado: periodoPlano.estado,
      fecha_inicio: periodoPlano.fecha_inicio,
      fecha_fin: periodoPlano.fecha_fin,
      fecha_inicio_matricula: periodoPlano.fecha_inicio_matricula,
      fecha_fin_matricula: periodoPlano.fecha_fin_matricula
    };
  }

  if (cursoPlano.asignatura) {
    const asignaturaPlano = typeof cursoPlano.asignatura.get === 'function'
      ? cursoPlano.asignatura.get({ plain: true })
      : cursoPlano.asignatura;
    cursoSanitizado.asignatura = {
      id: asignaturaPlano.id,
      codigo: asignaturaPlano.codigo,
      nombre: asignaturaPlano.nombre,
      creditos: asignaturaPlano.creditos,
      nivel_academico: asignaturaPlano.nivel_academico,
      activo: asignaturaPlano.activo
    };
  }

  if (cursoPlano.docente) {
    const docentePlano = typeof cursoPlano.docente.get === 'function'
      ? cursoPlano.docente.get({ plain: true })
      : cursoPlano.docente;
    cursoSanitizado.docente = {
      id: docentePlano.id,
      identificacion: docentePlano.identificacion,
      nombres: docentePlano.nombres,
      apellidos: docentePlano.apellidos,
      correo: docentePlano.correo,
      especialidad: docentePlano.especialidad,
      activo: docentePlano.activo
    };
  }

  return cursoSanitizado;
};

export const obtenerCursosDisponiblesEstudiante = async (estudianteId, periodoId) => {
  const estudiante = await Estudiante.findByPk(estudianteId, {
    include: [{ model: Carrera, as: 'carrera', attributes: atributosCarrera }]
  });

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  if (!ESTADOS_ESTUDIANTE_HABILITADOS.includes(estudiante.estado_academico)) {
    throw new ApiError(
      409,
      'El estado academico del estudiante no permite matricula.',
      'ESTUDIANTE_NO_HABILITADO'
    );
  }

  if (!estudiante.carrera_id || !estudiante.carrera || !estudiante.carrera.activo) {
    throw new ApiError(409, 'El estudiante no tiene una carrera activa asociada.', 'ESTUDIANTE_SIN_CARRERA');
  }

  const periodo = await PeriodoAcademico.findByPk(periodoId, { attributes: atributosPeriodo });

  if (!periodo) {
    throw new ApiError(404, 'Periodo academico no encontrado.', 'PERIODO_ACADEMICO_NOT_FOUND');
  }

  if (!ESTADOS_PERIODO_PERMITEN_MATRICULA.includes(periodo.estado)) {
    throw new ApiError(
      409,
      'El periodo academico no permite registrar matriculas.',
      'PERIODO_NO_PERMITE_MATRICULA'
    );
  }

  verificarVentanaMatricula(periodo);

  const cursos = await Curso.findAll({
    where: { periodo_id: periodoId, estado: COURSE_STATUS.OPEN },
    include: [
      { model: Asignatura, as: 'asignatura', attributes: atributosAsignatura },
      { model: Docente, as: 'docente', attributes: atributosDocente },
      { model: PeriodoAcademico, as: 'periodoAcademico', attributes: atributosPeriodo }
    ],
    order: [
      ['asignatura_id', 'ASC'],
      ['paralelo', 'ASC'],
      ['id', 'ASC']
    ]
  });

  const asignacionesMalla = await CarreraAsignatura.findAll({
    where: { carrera_id: estudiante.carrera_id },
    attributes: ['asignatura_id'],
    raw: true
  });
  const asignaturasEnMalla = new Set(asignacionesMalla.map((asignacion) => Number(asignacion.asignatura_id)));

  const matriculasEstudiante = await Matricula.findAll({
    where: { estudiante_id: estudianteId },
    attributes: ['curso_id'],
    raw: true
  });
  const cursosYaMatriculados = new Set(matriculasEstudiante.map((matricula) => Number(matricula.curso_id)));

  const cursoIds = cursos.map((curso) => curso.id);
  const ocupaciones = await Matricula.findAll({
    attributes: ['curso_id', [sequelize.fn('COUNT', sequelize.col('Matricula.id')), 'cantidad']],
    where: {
      curso_id: { [Op.in]: cursoIds },
      estado: { [Op.in]: ESTADOS_MATRICULA_OCUPAN_CUPO }
    },
    group: ['curso_id'],
    raw: true
  });
  const cantidadPorCurso = new Map(ocupaciones.map((registro) => [Number(registro.curso_id), Number(registro.cantidad)]));

  const cursosDisponibles = [];

  for (const curso of cursos) {
    if (!curso.asignatura || !curso.asignatura.activo) continue;
    if (!curso.docente || !curso.docente.activo) continue;
    if (!asignaturasEnMalla.has(Number(curso.asignatura_id))) continue;
    if (cursosYaMatriculados.has(Number(curso.id))) continue;

    const cantidadMatriculados = cantidadPorCurso.get(curso.id) ?? 0;
    const cuposDisponibles = curso.cupo_maximo - cantidadMatriculados;

    if (cuposDisponibles <= 0) continue;

    cursosDisponibles.push(sanitizarCursoDisponible(curso, cantidadMatriculados));
  }

  return {
    estudiante_id: estudiante.id,
    periodo: {
      id: periodo.id,
      codigo: periodo.codigo,
      nombre: periodo.nombre,
      estado: periodo.estado
    },
    cursos: cursosDisponibles
  };
};

export default {
  listarEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  obtenerCursosDisponiblesEstudiante
};
