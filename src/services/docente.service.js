import { Docente } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const allowedFields = ['identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'especialidad', 'activo'];

const pickPayload = (body) =>
  allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});

export const listarDocentes = async () => Docente.findAll();

export const obtenerDocentePorId = async (id) => {
  const docente = await Docente.findByPk(id, { include: [{ association: 'cursos' }] });

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  return docente;
};

export const crearDocente = async (data) => Docente.create(pickPayload(data));

export const actualizarDocente = async (id, data) => {
  const docente = await Docente.findByPk(id);

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  const payload = pickPayload(data);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  await docente.update(payload);
  return obtenerDocentePorId(id);
};

export const eliminarDocente = async (id) => {
  const docente = await Docente.findByPk(id);

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  await docente.update({ activo: false });
  return docente;
};

export default {
  listarDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  eliminarDocente
};
