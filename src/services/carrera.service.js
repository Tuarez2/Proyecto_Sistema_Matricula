import { Carrera, Facultad } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const camposPermitidos = ['codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];
const inclusiones = [{ association: 'facultad' }, { association: 'asignaturas' }, { association: 'estudiantes' }];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

const asegurarFacultadExistente = async (facultadId) => {
  const facultad = await Facultad.findByPk(facultadId);

  if (!facultad) {
    throw new ApiError(400, 'La facultad especificada no existe.', 'FACULTAD_NOT_FOUND');
  }
};

export const listarCarreras = async () => Carrera.findAll({ include: inclusiones });

export const obtenerCarreraPorId = async (id) => {
  const carrera = await Carrera.findByPk(id, { include: inclusiones });

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  return carrera;
};

export const crearCarrera = async (datos) => {
  await asegurarFacultadExistente(datos.facultad_id);
  return Carrera.create(seleccionarDatosPermitidos(datos));
};

export const actualizarCarrera = async (id, datos) => {
  const carrera = await Carrera.findByPk(id);

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  const datosPermitidos = seleccionarDatosPermitidos(datos);

  if (Object.keys(datosPermitidos).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  if (datosPermitidos.facultad_id !== undefined) {
    await asegurarFacultadExistente(datosPermitidos.facultad_id);
  }

  await carrera.update(datosPermitidos);
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
