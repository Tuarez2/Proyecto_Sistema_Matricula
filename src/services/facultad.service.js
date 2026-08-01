import { Op } from 'sequelize';

import { Carrera, Facultad, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const MENSAJE_FACULTAD_NO_ENCONTRADA = 'Facultad no encontrada.';

const camposPermitidosCreacion = ['codigo', 'nombre', 'activo'];
const camposPermitidosActualizacion = ['codigo', 'nombre'];
const atributosFacultad = ['id', 'codigo', 'nombre', 'activo', 'created_at', 'updated_at'];
const atributosCarrera = ['id', 'codigo', 'nombre', 'duracion_semestres', 'activo'];

const seleccionarDatosPermitidos = (datos, camposPermitidos) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(datos, campo) && datos[campo] !== undefined) {
      datosPermitidos[campo] = datos[campo];
    }
    return datosPermitidos;
  }, {});

const normalizarCodigo = (codigo) => codigo.trim().toUpperCase();
const normalizarNombre = (nombre) => nombre.trim().replace(/\s+/g, ' ');

const normalizarDatosFacultad = (datosFacultad) => {
  const datosNormalizados = { ...datosFacultad };

  if (datosNormalizados.codigo !== undefined) {
    datosNormalizados.codigo = normalizarCodigo(datosNormalizados.codigo);
  }

  if (datosNormalizados.nombre !== undefined) {
    datosNormalizados.nombre = normalizarNombre(datosNormalizados.nombre);
  }

  return datosNormalizados;
};

const sanitizarFacultad = (facultad) => {
  if (!facultad) return null;

  const facultadPlano = typeof facultad.get === 'function' ? facultad.get({ plain: true }) : facultad;

  return {
    id: facultadPlano.id,
    codigo: facultadPlano.codigo,
    nombre: facultadPlano.nombre,
    activo: facultadPlano.activo,
    created_at: facultadPlano.created_at,
    updated_at: facultadPlano.updated_at,
    carreras: Array.isArray(facultadPlano.carreras)
      ? facultadPlano.carreras.map((carrera) => ({
          id: carrera.id,
          codigo: carrera.codigo,
          nombre: carrera.nombre,
          duracion_semestres: carrera.duracion_semestres,
          activo: carrera.activo
        }))
      : undefined
  };
};

const buscarFacultadOError = async (id, opciones = {}) => {
  const facultad = await Facultad.findByPk(id, opciones);

  if (!facultad) {
    throw new ApiError(404, MENSAJE_FACULTAD_NO_ENCONTRADA, 'FACULTAD_NOT_FOUND');
  }

  return facultad;
};

const asegurarFacultadUnica = async ({ codigo, nombre }, facultadIdExcluida = null, opciones = {}) => {
  const condicionesUnicas = [];

  if (codigo !== undefined) {
    condicionesUnicas.push({ codigo });
  }

  if (nombre !== undefined) {
    condicionesUnicas.push({ nombre });
  }

  if (condicionesUnicas.length === 0) return;

  const condiciones = { [Op.or]: condicionesUnicas };

  if (facultadIdExcluida) {
    condiciones.id = { [Op.ne]: facultadIdExcluida };
  }

  const facultadExistente = await Facultad.findOne({ where: condiciones, ...opciones });

  if (!facultadExistente) return;

  if (codigo !== undefined && facultadExistente.codigo === codigo) {
    throw new ApiError(409, 'El codigo de facultad ya esta registrado.', 'FACULTAD_CODIGO_DUPLICATED');
  }

  if (nombre !== undefined && facultadExistente.nombre === nombre) {
    throw new ApiError(409, 'El nombre de facultad ya esta registrado.', 'FACULTAD_NOMBRE_DUPLICATED');
  }

  throw new ApiError(409, 'La facultad ya existe.', 'FACULTAD_DUPLICATED');
};

const construirFiltrosFacultad = (filtros = {}) => {
  const condiciones = {};

  if (filtros.codigo) {
    condiciones.codigo = { [Op.like]: `%${filtros.codigo.trim().toUpperCase()}%` };
  }

  if (filtros.nombre) {
    condiciones.nombre = { [Op.like]: `%${filtros.nombre.trim()}%` };
  }

  if (filtros.activo !== undefined) {
    condiciones.activo = filtros.activo;
  }

  return condiciones;
};

export const listarFacultades = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await Facultad.findAndCountAll({
    where: construirFiltrosFacultad(filtros),
    attributes: atributosFacultad,
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['nombre', 'ASC'],
      ['id', 'ASC']
    ]
  });

  return {
    data: registros.map(sanitizarFacultad),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerFacultadPorId = async (id) => {
  const facultad = await buscarFacultadOError(id, {
    attributes: atributosFacultad,
    include: [
      {
        model: Carrera,
        as: 'carreras',
        attributes: atributosCarrera
      }
    ],
    order: [[{ model: Carrera, as: 'carreras' }, 'nombre', 'ASC']]
  });

  return sanitizarFacultad(facultad);
};

export const crearFacultad = async (datos) =>
  sequelize.transaction(async (transaction) => {
    const datosPermitidos = normalizarDatosFacultad(seleccionarDatosPermitidos(datos, camposPermitidosCreacion));

    await asegurarFacultadUnica(datosPermitidos, null, { transaction });

    const facultad = await Facultad.create(datosPermitidos, { transaction });

    return sanitizarFacultad(
      await Facultad.findByPk(facultad.id, {
        attributes: atributosFacultad,
        transaction
      })
    );
  });

export const actualizarFacultad = async (id, datos) =>
  sequelize.transaction(async (transaction) => {
    const facultad = await buscarFacultadOError(id, { transaction });
    const datosPermitidos = normalizarDatosFacultad(seleccionarDatosPermitidos(datos, camposPermitidosActualizacion));

    if (Object.keys(datosPermitidos).length === 0) {
      throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
    }

    await asegurarFacultadUnica(datosPermitidos, facultad.id, { transaction });
    await facultad.update(datosPermitidos, { transaction });

    return sanitizarFacultad(
      await Facultad.findByPk(facultad.id, {
        attributes: atributosFacultad,
        transaction
      })
    );
  });

export const cambiarEstadoFacultad = async (id, activo) =>
  sequelize.transaction(async (transaction) => {
    const facultad = await buscarFacultadOError(id, { transaction });

    if (facultad.activo === activo) {
      return sanitizarFacultad(facultad);
    }

    if (!activo) {
      const carrerasActivas = await Carrera.count({
        where: {
          facultad_id: facultad.id,
          activo: true
        },
        transaction
      });

      if (carrerasActivas > 0) {
        throw new ApiError(
          409,
          'No se puede desactivar la facultad porque tiene carreras activas. Desactive o reasigne primero las carreras activas.',
          'FACULTAD_HAS_ACTIVE_CARRERAS'
        );
      }
    }

    await facultad.update({ activo }, { transaction });

    return sanitizarFacultad(
      await Facultad.findByPk(facultad.id, {
        attributes: atributosFacultad,
        transaction
      })
    );
  });

export default {
  listarFacultades,
  obtenerFacultadPorId,
  crearFacultad,
  actualizarFacultad,
  cambiarEstadoFacultad
};
