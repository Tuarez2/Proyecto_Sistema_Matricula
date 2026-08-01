import { COURSE_STATUS } from '../constants/domain.constants.js';
import { Asignatura, Curso, Docente, PeriodoAcademico } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const allowedFields = [
  'periodo_id',
  'asignatura_id',
  'docente_id',
  'paralelo',
  'aula',
  'horario',
  'cupo_maximo',
  'estado'
];

const listInclude = [{ association: 'asignatura' }, { association: 'docente' }, { association: 'periodoAcademico' }];
const detailInclude = [...listInclude, { association: 'estudiantesMatriculados' }];

const pickPayload = (body) =>
  allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});

const ensureReferencesExist = async ({ periodo_id, asignatura_id, docente_id }) => {
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

export const listarCursos = async () => Curso.findAll({ include: listInclude });

export const obtenerCursoPorId = async (id) => {
  const curso = await Curso.findByPk(id, { include: detailInclude });

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  return curso;
};

export const crearCurso = async (data) => {
  await ensureReferencesExist(data);
  return Curso.create(pickPayload(data));
};

export const actualizarCurso = async (id, data) => {
  const curso = await Curso.findByPk(id);

  if (!curso) {
    throw new ApiError(404, 'Curso no encontrado.', 'CURSO_NOT_FOUND');
  }

  const payload = pickPayload(data);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  await ensureReferencesExist(payload);
  await curso.update(payload);
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
