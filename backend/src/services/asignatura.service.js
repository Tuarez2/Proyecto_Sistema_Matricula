import { Asignatura } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const camposPermitidos = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];
const inclusiones = [{ association: 'carreras' }, { association: 'cursos' }];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

export const listarAsignaturas = async () => Asignatura.findAll({ include: inclusiones });

export const obtenerAsignaturaPorId = async (id) => {
  const asignatura = await Asignatura.findByPk(id, { include: inclusiones });

  if (!asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  return asignatura;
};

export const crearAsignatura = async (datos) => Asignatura.create(seleccionarDatosPermitidos(datos));

export const actualizarAsignatura = async (id, datos) => {
  const asignatura = await Asignatura.findByPk(id);

  if (!asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  const datosPermitidos = seleccionarDatosPermitidos(datos);

  if (Object.keys(datosPermitidos).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  await asignatura.update(datosPermitidos);
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
