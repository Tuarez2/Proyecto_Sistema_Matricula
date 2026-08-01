import { Carrera, Facultad } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const allowedFields = ['codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];
const include = [{ association: 'facultad' }, { association: 'asignaturas' }, { association: 'estudiantes' }];

const pickPayload = (body) =>
  allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});

const ensureFacultadExists = async (facultadId) => {
  const facultad = await Facultad.findByPk(facultadId);

  if (!facultad) {
    throw new ApiError(400, 'La facultad especificada no existe.', 'FACULTAD_NOT_FOUND');
  }
};

export const listarCarreras = async () => Carrera.findAll({ include });

export const obtenerCarreraPorId = async (id) => {
  const carrera = await Carrera.findByPk(id, { include });

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  return carrera;
};

export const crearCarrera = async (data) => {
  await ensureFacultadExists(data.facultad_id);
  return Carrera.create(pickPayload(data));
};

export const actualizarCarrera = async (id, data) => {
  const carrera = await Carrera.findByPk(id);

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  const payload = pickPayload(data);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  if (payload.facultad_id !== undefined) {
    await ensureFacultadExists(payload.facultad_id);
  }

  await carrera.update(payload);
  return obtenerCarreraPorId(id);
};

export const eliminarCarrera = async (id) => {
  const carrera = await Carrera.findByPk(id);

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  await carrera.update({ activo: false });
  return carrera;
};

export default {
  listarCarreras,
  obtenerCarreraPorId,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera
};
