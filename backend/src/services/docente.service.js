import { Docente } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const camposPermitidos = ['identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'especialidad', 'activo'];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

export const listarDocentes = async () => Docente.findAll();

export const obtenerDocentePorId = async (id) => {
  const docente = await Docente.findByPk(id, { include: [{ association: 'cursos' }] });

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  return docente;
};

export const crearDocente = async (datos) => Docente.create(seleccionarDatosPermitidos(datos));

export const actualizarDocente = async (id, datos) => {
  const docente = await Docente.findByPk(id);

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  const datosPermitidos = seleccionarDatosPermitidos(datos);

  if (Object.keys(datosPermitidos).length === 0) {
    throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
  }

  await docente.update(datosPermitidos);
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
