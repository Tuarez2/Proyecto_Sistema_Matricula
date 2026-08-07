import { Op } from 'sequelize';

import { Asignatura, Carrera, CarreraAsignatura, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const MENSAJE_ASIGNACION_NO_ENCONTRADA = 'Asignacion curricular no encontrada.';
const camposPermitidos = ['carrera_id', 'asignatura_id'];
const atributosCarrera = ['id', 'codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];
const atributosAsignatura = ['id', 'codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];

const inclusionCarrera = {
  model: Carrera,
  as: 'carrera',
  attributes: atributosCarrera
};

const inclusionAsignatura = {
  model: Asignatura,
  as: 'asignatura',
  attributes: atributosAsignatura
};

const construirIdAsignacion = (carreraId, asignaturaId) => `${carreraId}-${asignaturaId}`;

export const interpretarIdAsignacion = (id) => {
  const coincidencia = /^(\d+)-(\d+)$/.exec(String(id));

  if (!coincidencia) {
    throw new ApiError(400, 'El id de asignacion debe tener formato carrera_id-asignatura_id.', 'ASIGNACION_ID_INVALIDO');
  }

  return {
    carrera_id: Number(coincidencia[1]),
    asignatura_id: Number(coincidencia[2])
  };
};

const seleccionarDatosPermitidos = (datos) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(datos, campo) && datos[campo] !== undefined) {
      datosPermitidos[campo] = datos[campo];
    }
    return datosPermitidos;
  }, {});

const sanitizarAsignacion = (asignacion) => {
  if (!asignacion) return null;

  const asignacionPlano = typeof asignacion.get === 'function' ? asignacion.get({ plain: true }) : asignacion;

  return {
    id: construirIdAsignacion(asignacionPlano.carrera_id, asignacionPlano.asignatura_id),
    carrera_id: asignacionPlano.carrera_id,
    asignatura_id: asignacionPlano.asignatura_id,
    created_at: asignacionPlano.created_at,
    updated_at: asignacionPlano.updated_at,
    carrera: asignacionPlano.carrera
      ? {
          id: asignacionPlano.carrera.id,
          codigo: asignacionPlano.carrera.codigo,
          nombre: asignacionPlano.carrera.nombre,
          duracion_semestres: asignacionPlano.carrera.duracion_semestres,
          facultad_id: asignacionPlano.carrera.facultad_id,
          activo: asignacionPlano.carrera.activo
        }
      : undefined,
    asignatura: asignacionPlano.asignatura
      ? {
          id: asignacionPlano.asignatura.id,
          codigo: asignacionPlano.asignatura.codigo,
          nombre: asignacionPlano.asignatura.nombre,
          creditos: asignacionPlano.asignatura.creditos,
          nivel_academico: asignacionPlano.asignatura.nivel_academico,
          activo: asignacionPlano.asignatura.activo
        }
      : undefined
  };
};

const sanitizarCarrera = (carrera) => {
  const carreraPlano = typeof carrera.get === 'function' ? carrera.get({ plain: true }) : carrera;

  return {
    id: carreraPlano.id,
    codigo: carreraPlano.codigo,
    nombre: carreraPlano.nombre,
    duracion_semestres: carreraPlano.duracion_semestres,
    facultad_id: carreraPlano.facultad_id,
    activo: carreraPlano.activo
  };
};

const sanitizarAsignatura = (asignatura) => {
  const asignaturaPlano = typeof asignatura.get === 'function' ? asignatura.get({ plain: true }) : asignatura;

  return {
    id: asignaturaPlano.id,
    codigo: asignaturaPlano.codigo,
    nombre: asignaturaPlano.nombre,
    creditos: asignaturaPlano.creditos,
    nivel_academico: asignaturaPlano.nivel_academico,
    activo: asignaturaPlano.activo
  };
};

const construirFiltrosAsignacion = (filtros = {}) => {
  const condiciones = {};
  const carreraWhere = {};
  const asignaturaWhere = {};

  if (filtros.carrera_id !== undefined) {
    condiciones.carrera_id = filtros.carrera_id;
  }

  if (filtros.asignatura_id !== undefined) {
    condiciones.asignatura_id = filtros.asignatura_id;
  }

  if (filtros.codigo_carrera) {
    carreraWhere.codigo = { [Op.like]: `%${filtros.codigo_carrera.trim().toUpperCase()}%` };
  }

  if (filtros.nombre_carrera) {
    carreraWhere.nombre = { [Op.like]: `%${filtros.nombre_carrera.trim()}%` };
  }

  if (filtros.codigo_asignatura) {
    asignaturaWhere.codigo = { [Op.like]: `%${filtros.codigo_asignatura.trim().toUpperCase()}%` };
  }

  if (filtros.nombre_asignatura) {
    asignaturaWhere.nombre = { [Op.like]: `%${filtros.nombre_asignatura.trim()}%` };
  }

  return {
    condiciones,
    carreraWhere,
    asignaturaWhere
  };
};

const buscarAsignacionOError = async ({ carrera_id, asignatura_id }, opciones = {}) => {
  const asignacion = await CarreraAsignatura.findOne({
    where: { carrera_id, asignatura_id },
    include: [inclusionCarrera, inclusionAsignatura],
    ...opciones
  });

  if (!asignacion) {
    throw new ApiError(404, MENSAJE_ASIGNACION_NO_ENCONTRADA, 'ASIGNACION_CURRICULAR_NOT_FOUND');
  }

  return asignacion;
};

const verificarCarreraExistente = async (carreraId, opciones = {}) => {
  const carrera = await Carrera.findByPk(carreraId, opciones);

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  if (!carrera.activo) {
    throw new ApiError(409, 'La carrera no esta activa.', 'CARRERA_INACTIVA');
  }

  return carrera;
};

const verificarAsignaturaExistente = async (asignaturaId, opciones = {}) => {
  const asignatura = await Asignatura.findByPk(asignaturaId, opciones);

  if (!asignatura) {
    throw new ApiError(404, 'Asignatura no encontrada.', 'ASIGNATURA_NOT_FOUND');
  }

  if (!asignatura.activo) {
    throw new ApiError(409, 'La asignatura no esta activa.', 'ASIGNATURA_INACTIVA');
  }

  return asignatura;
};

const verificarAsignacionDuplicada = async ({ carrera_id, asignatura_id }, asignacionActual = null, opciones = {}) => {
  if (asignacionActual?.carrera_id === carrera_id && asignacionActual?.asignatura_id === asignatura_id) {
    return;
  }

  const asignacionExistente = await CarreraAsignatura.findOne({
    where: { carrera_id, asignatura_id },
    ...opciones
  });

  if (asignacionExistente) {
    throw new ApiError(409, 'La asignatura ya esta asociada a la carrera.', 'ASIGNACION_CURRICULAR_DUPLICATED');
  }
};

export const listarAsignacionesCurriculares = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);
  const { condiciones, carreraWhere, asignaturaWhere } = construirFiltrosAsignacion(filtros);
  const tieneFiltroCarrera = Object.keys(carreraWhere).length > 0;
  const tieneFiltroAsignatura = Object.keys(asignaturaWhere).length > 0;

  const { rows: registros, count: totalRegistros } = await CarreraAsignatura.findAndCountAll({
    where: condiciones,
    include: [
      {
        ...inclusionCarrera,
        where: tieneFiltroCarrera ? carreraWhere : undefined,
        required: tieneFiltroCarrera
      },
      {
        ...inclusionAsignatura,
        where: tieneFiltroAsignatura ? asignaturaWhere : undefined,
        required: tieneFiltroAsignatura
      }
    ],
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['carrera_id', 'ASC'],
      ['asignatura_id', 'ASC']
    ]
  });

  return {
    data: registros.map(sanitizarAsignacion),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerAsignacionCurricularPorId = async (id) =>
  sanitizarAsignacion(await buscarAsignacionOError(interpretarIdAsignacion(id)));

export const listarAsignaturasDeCarrera = async (carreraId, filtros = {}) => {
  const carrera = await Carrera.findByPk(carreraId, { attributes: atributosCarrera });

  if (!carrera) {
    throw new ApiError(404, 'Carrera no encontrada.', 'CARRERA_NOT_FOUND');
  }

  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);
  const asignaturaWhere = {};

  if (filtros.activo !== undefined) {
    asignaturaWhere.activo = filtros.activo;
  }

  const { rows: registros, count: totalRegistros } = await CarreraAsignatura.findAndCountAll({
    where: { carrera_id: carreraId },
    include: [
      {
        ...inclusionAsignatura,
        where: Object.keys(asignaturaWhere).length > 0 ? asignaturaWhere : undefined,
        required: Object.keys(asignaturaWhere).length > 0
      }
    ],
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [['asignatura_id', 'ASC']]
  });

  return {
    carrera: sanitizarCarrera(carrera),
    data: registros.map((asignacion) => sanitizarAsignatura(asignacion.asignatura)),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const crearAsignacionCurricular = async (datos) =>
  sequelize.transaction(async (transaction) => {
    const datosAsignacion = seleccionarDatosPermitidos(datos);

    await verificarCarreraExistente(datosAsignacion.carrera_id, { transaction });
    await verificarAsignaturaExistente(datosAsignacion.asignatura_id, { transaction });
    await verificarAsignacionDuplicada(datosAsignacion, null, { transaction });

    await CarreraAsignatura.create(datosAsignacion, { transaction });

    return sanitizarAsignacion(
      await CarreraAsignatura.findOne({
        where: datosAsignacion,
        include: [inclusionCarrera, inclusionAsignatura],
        transaction
      })
    );
  });

export const actualizarAsignacionCurricular = async (id, datos) =>
  sequelize.transaction(async (transaction) => {
    const identificadorActual = interpretarIdAsignacion(id);
    const asignacion = await buscarAsignacionOError(identificadorActual, { transaction });
    const datosPermitidos = seleccionarDatosPermitidos(datos);

    if (Object.keys(datosPermitidos).length === 0) {
      throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
    }

    const datosActualizados = {
      carrera_id: datosPermitidos.carrera_id ?? asignacion.carrera_id,
      asignatura_id: datosPermitidos.asignatura_id ?? asignacion.asignatura_id
    };

    await verificarCarreraExistente(datosActualizados.carrera_id, { transaction });
    await verificarAsignaturaExistente(datosActualizados.asignatura_id, { transaction });
    await verificarAsignacionDuplicada(datosActualizados, identificadorActual, { transaction });

    await CarreraAsignatura.update(datosActualizados, {
      where: identificadorActual,
      transaction
    });

    return sanitizarAsignacion(
      await CarreraAsignatura.findOne({
        where: datosActualizados,
        include: [inclusionCarrera, inclusionAsignatura],
        transaction
      })
    );
  });

export const eliminarAsignacionCurricular = async (id) =>
  sequelize.transaction(async (transaction) => {
    const identificador = interpretarIdAsignacion(id);
    const asignacion = await buscarAsignacionOError(identificador, { transaction });

    await CarreraAsignatura.destroy({
      where: identificador,
      transaction
    });

    return sanitizarAsignacion(asignacion);
  });

export default {
  listarAsignacionesCurriculares,
  obtenerAsignacionCurricularPorId,
  listarAsignaturasDeCarrera,
  crearAsignacionCurricular,
  actualizarAsignacionCurricular,
  eliminarAsignacionCurricular,
  interpretarIdAsignacion
};
