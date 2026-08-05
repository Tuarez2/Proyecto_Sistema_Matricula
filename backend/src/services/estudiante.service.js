import { Op } from 'sequelize';

import { ACADEMIC_STATUS } from '../constants/domain.constants.js';
import { Carrera, Estudiante } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

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
const atributosEstudiante = ['id', 'carrera_id', 'numero_matricula', 'identificacion', 'nombres', 'apellidos', 'correo', 'telefono', 'fecha_nacimiento', 'estado_academico', 'nivel_academico_actual', 'created_at', 'updated_at'];
const atributosCarrera = ['id', 'codigo', 'nombre', 'duracion_semestres', 'facultad_id', 'activo'];

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

const construirFiltrosEstudiante = (filtros = {}) => {
  const condiciones = {};

  if (filtros.numero_matricula) {
    condiciones.numero_matricula = { [Op.like]: `%${filtros.numero_matricula.trim()}%` };
  }

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

  if (filtros.carrera_id !== undefined) {
    condiciones.carrera_id = filtros.carrera_id;
  }

  if (filtros.estado_academico !== undefined) {
    condiciones.estado_academico = filtros.estado_academico;
  }

  if (filtros.nivel_academico_actual !== undefined) {
    condiciones.nivel_academico_actual = filtros.nivel_academico_actual;
  }

  return condiciones;
};

const sanitizarEstudiante = (estudiante) => {
  const estudiantePlano = typeof estudiante.get === 'function' ? estudiante.get({ plain: true }) : estudiante;

  return {
    id: estudiantePlano.id,
    carrera_id: estudiantePlano.carrera_id,
    numero_matricula: estudiantePlano.numero_matricula,
    identificacion: estudiantePlano.identificacion,
    nombres: estudiantePlano.nombres,
    apellidos: estudiantePlano.apellidos,
    correo: estudiantePlano.correo,
    telefono: estudiantePlano.telefono,
    fecha_nacimiento: estudiantePlano.fecha_nacimiento,
    estado_academico: estudiantePlano.estado_academico,
    nivel_academico_actual: estudiantePlano.nivel_academico_actual,
    created_at: estudiantePlano.created_at,
    updated_at: estudiantePlano.updated_at,
    carrera: estudiantePlano.carrera
      ? {
          id: estudiantePlano.carrera.id,
          codigo: estudiantePlano.carrera.codigo,
          nombre: estudiantePlano.carrera.nombre,
          duracion_semestres: estudiantePlano.carrera.duracion_semestres,
          facultad_id: estudiantePlano.carrera.facultad_id,
          activo: estudiantePlano.carrera.activo
        }
      : null
  };
};

export const listarEstudiantes = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await Estudiante.findAndCountAll({
    where: construirFiltrosEstudiante(filtros),
    attributes: atributosEstudiante,
    include: inclusionesListado,
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
    data: registros.map(sanitizarEstudiante),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

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
