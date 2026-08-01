import { Asignatura } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const allowedFields = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];
const include = [{ association: 'carreras' }, { association: 'cursos' }];

const pickPayload = (body) =>
  allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});

export const listarAsignaturas = async () => Asignatura.findAll({ include });

export const obtenerAsignaturaPorId = async (id) => {
  const asignatura = await Asignatura.findByPk(id, { include });

  if (!asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  return asignatura;
};

export const crearAsignatura = async (data) => Asignatura.create(pickPayload(data));

export const actualizarAsignatura = async (id, data) => {
  const asignatura = await Asignatura.findByPk(id);

  if (!asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  const payload = pickPayload(data);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  await asignatura.update(payload);
  return obtenerAsignaturaPorId(id);
};

export const eliminarAsignatura = async (id) => {
  const asignatura = await Asignatura.findByPk(id);

  if (!asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  await asignatura.update({ activo: false });
  return asignatura;
};

export default {
  listarAsignaturas,
  obtenerAsignaturaPorId,
  crearAsignatura,
  actualizarAsignatura,
  eliminarAsignatura
};
