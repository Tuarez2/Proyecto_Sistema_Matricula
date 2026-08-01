import { COURSE_STATUS } from '../constants/domain.constants.js';
import { Asignatura, Curso, Docente, PeriodoAcademico } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

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

const inclusionesListado = [{ association: 'asignatura' }, { association: 'docente' }, { association: 'periodoAcademico' }];
const inclusionesDetalle = [...inclusionesListado, { association: 'estudiantesMatriculados' }];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

const asegurarReferenciasExistentes = async ({ periodo_id, asignatura_id, docente_id }) => {
  if (periodo_id !== undefined && !(await PeriodoAcademico.findByPk(periodo_id))) {
    throw new ApiError(400, 'El periodo academico especificado no existe.', 'PERIODO_ACADEMICO_NOT_FOUND');
  }

  if (asignatura_id !== undefined && !(await Asignatura.findByPk(asignatura_id))) {
    throw new ApiError(400, 'La asignatura especificada no existe.', 'ASIGNATURA_NOT_FOUND');
  }

  if (docente_id !== undefined && !(await Docente.findByPk(docente_id))) {
    throw new ApiError(400, 'El docente especificado no existe.', 'DOCENTE_NOT_FOUND');
  }
};

export const listarCursos = async () => Curso.findAll({ include: inclusionesListado });

export const obtenerCursoPorId = async (id) => {
  const curso = await Curso.findByPk(id, { include: inclusionesDetalle });

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  return curso;
};

export const crearCurso = async (datos) => {
  await asegurarReferenciasExistentes(datos);
  return Curso.create(seleccionarDatosPermitidos(datos));
};

export const actualizarCurso = async (id, datos) => {
  const curso = await Curso.findByPk(id);

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  const datosPermitidos = seleccionarDatosPermitidos(datos);

  if (Object.keys(datosPermitidos).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  await asegurarReferenciasExistentes(datosPermitidos);
  await curso.update(datosPermitidos);
  return obtenerCursoPorId(id);
};

export const eliminarCurso = async (id) => {
  const curso = await Curso.findByPk(id);

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  await curso.update({ estado: COURSE_STATUS.CANCELLED });
  return curso;
};

export default {
  listarCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso
};
