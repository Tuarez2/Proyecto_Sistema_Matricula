import { Op } from 'sequelize';

import { Carrera, Facultad } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const camposPermitidos = ['codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];
const inclusiones = [{ association: 'facultad' }, { association: 'asignaturas' }, { association: 'estudiantes' }];
const inclusionesListado = [{ association: 'facultad' }];
const atributosCarrera = ['id', 'codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo', 'created_at', 'updated_at'];
const atributosFacultad = ['id', 'codigo', 'nombre', 'activo'];

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

  return facultad;
};

const asegurarCodigoUnico = async (codigo, carreraIdExcluida = null) => {
  if (!codigo) return;

  const condiciones = { codigo };

  if (carreraIdExcluida) {
    condiciones.id = { [Op.ne]: carreraIdExcluida };
  }

  const carreraExistente = await Carrera.findOne({ where: condiciones });

  if (carreraExistente) {
    throw new ApiError(409, 'El codigo de carrera ya esta registrado.', 'CARRERA_CODIGO_DUPLICATED');
  }
};

const construirFiltrosCarrera = (filtros = {}) => {
  const condiciones = {};

  if (filtros.codigo) {
    condiciones.codigo = { [Op.like]: `%${filtros.codigo.trim().toUpperCase()}%` };
  }

  if (filtros.nombre) {
    condiciones.nombre = { [Op.like]: `%${filtros.nombre.trim()}%` };
  }

  if (filtros.facultad_id !== undefined) {
    condiciones.facultad_id = filtros.facultad_id;
  }

  if (filtros.activo !== undefined) {
    condiciones.activo = filtros.activo;
  }

  return condiciones;
};

const sanitizarCarrera = (carrera) => {
  const carreraPlano = typeof carrera.get === 'function' ? carrera.get({ plain: true }) : carrera;

  return {
    id: carreraPlano.id,
    codigo: carreraPlano.codigo,
    nombre: carreraPlano.nombre,
    duracion_semestres: carreraPlano.duracion_semestres,
    facultad_id: carreraPlano.facultad_id,
    activo: carreraPlano.activo,
    created_at: carreraPlano.created_at,
    updated_at: carreraPlano.updated_at,
    facultad: carreraPlano.facultad
      ? {
          id: carreraPlano.facultad.id,
          codigo: carreraPlano.facultad.codigo,
          nombre: carreraPlano.facultad.nombre,
          activo: carreraPlano.facultad.activo
        }
      : null
  };
};

export const listarCarreras = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await Carrera.findAndCountAll({
    where: construirFiltrosCarrera(filtros),
    attributes: atributosCarrera,
    include: inclusionesListado,
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['nombre', 'ASC'],
      ['id', 'ASC']
    ]
  });

  return {
    data: registros.map(sanitizarCarrera),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerCarreraPorId = async (id) => {
  const carrera = await Carrera.findByPk(id, { include: inclusiones });

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  return carrera;
};

export const crearCarrera = async (datos) => {
  await asegurarFacultadExistente(datos.facultad_id);
  await asegurarCodigoUnico(datos.codigo);
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

  if (datosPermitidos.codigo !== undefined) {
    await asegurarCodigoUnico(datosPermitidos.codigo, carrera.id);
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
