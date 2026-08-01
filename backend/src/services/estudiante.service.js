import { ACADEMIC_STATUS } from '../constants/domain.constants.js';
import { Carrera, Estudiante } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

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

const inclusionesListado = [{ association: 'carrera' }];
const inclusionesDetalle = [{ association: 'carrera' }, { association: 'cursosMatriculados' }];

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

export const listarEstudiantes = async () => Estudiante.findAll({ include: inclusionesListado });

export const obtenerEstudiantePorId = async (id) => {
  const estudiante = await Estudiante.findByPk(id, { include: inclusionesDetalle });

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  return estudiante;
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

export default {
  listarEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
};
