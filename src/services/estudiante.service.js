import { ACADEMIC_STATUS } from '../constants/domain.constants.js';
import { Carrera, Estudiante } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const allowedFields = [
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

const listInclude = [{ association: 'carrera' }];
const detailInclude = [{ association: 'carrera' }, { association: 'cursosMatriculados' }];

const pickPayload = (body) =>
  allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});

const ensureCarreraExists = async (carreraId) => {
  const carrera = await Carrera.findByPk(carreraId);

  if (!carrera) {
    throw new ApiError(400, 'La carrera especificada no existe.', 'CARRERA_NOT_FOUND');
  }
};

export const listarEstudiantes = async () => Estudiante.findAll({ include: listInclude });

export const obtenerEstudiantePorId = async (id) => {
  const estudiante = await Estudiante.findByPk(id, { include: detailInclude });

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  return estudiante;
};

export const crearEstudiante = async (data) => {
  await ensureCarreraExists(data.carrera_id);
  return Estudiante.create(pickPayload(data));
};

export const actualizarEstudiante = async (id, data) => {
  const estudiante = await Estudiante.findByPk(id);

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  const payload = pickPayload(data);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  if (payload.carrera_id !== undefined) {
    await ensureCarreraExists(payload.carrera_id);
  }

  await estudiante.update(payload);
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

export default {
  listarEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
};
