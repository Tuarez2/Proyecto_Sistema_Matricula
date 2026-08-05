import { Op } from 'sequelize';

import { Docente } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const camposPermitidos = ['identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'especialidad', 'activo'];
const atributosDocente = ['id', 'identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'especialidad', 'activo', 'created_at', 'updated_at'];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

const construirFiltrosDocente = (filtros = {}) => {
  const condiciones = {};

  if (filtros.identificacion) {
    condiciones.identificacion = { [Op.like]: `%${filtros.identificacion.trim()}%` };
  }

  if (filtros.nombres) {
    condiciones.nombres = { [Op.like]: `%${filtros.nombres.trim()}%` };
  }

  if (filtros.apellidos) {
    condiciones.apellidos = { [Op.like]: `%${filtros.apellidos.trim()}%` };
  }

  if (filtros.correo) {
    condiciones.correo = { [Op.like]: `%${filtros.correo.trim()}%` };
  }

  if (filtros.especialidad) {
    condiciones.especialidad = { [Op.like]: `%${filtros.especialidad.trim()}%` };
  }

  if (filtros.activo !== undefined) {
    condiciones.activo = filtros.activo;
  }

  return condiciones;
};

const sanitizarDocente = (docente) => {
  const docentePlano = typeof docente.get === 'function' ? docente.get({ plain: true }) : docente;

  return {
    id: docentePlano.id,
    identificacion: docentePlano.identificacion,
    nombres: docentePlano.nombres,
    apellidos: docentePlano.apellidos,
    correo: docentePlano.correo,
    telefono: docentePlano.telefono,
    especialidad: docentePlano.especialidad,
    activo: docentePlano.activo,
    created_at: docentePlano.created_at,
    updated_at: docentePlano.updated_at
  };
};

export const listarDocentes = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await Docente.findAndCountAll({
    where: construirFiltrosDocente(filtros),
    attributes: atributosDocente,
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['apellidos', 'ASC'],
      ['nombres', 'ASC'],
      ['id', 'ASC']
    ]
  });

  return {
    data: registros.map(sanitizarDocente),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

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
