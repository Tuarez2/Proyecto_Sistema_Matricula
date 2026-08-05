import { Op } from 'sequelize';

import { Asignatura } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const camposPermitidos = ['codigo', 'nombre', 'creditos', 'nivel_academico', 'activo'];
const inclusiones = [{ association: 'carreras' }, { association: 'cursos' }];
const atributosAsignatura = ['id', 'codigo', 'nombre', 'creditos', 'nivel_academico', 'activo', 'created_at', 'updated_at'];

const seleccionarDatosPermitidos = (cuerpoSolicitud) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpoSolicitud, campo) && cuerpoSolicitud[campo] !== undefined) {
      datosPermitidos[campo] = cuerpoSolicitud[campo];
    }
    return datosPermitidos;
  }, {});

const construirFiltrosAsignatura = (filtros = {}) => {
  const condiciones = {};

  if (filtros.codigo) {
    condiciones.codigo = { [Op.like]: `%${filtros.codigo.trim().toUpperCase()}%` };
  }

  if (filtros.nombre) {
    condiciones.nombre = { [Op.like]: `%${filtros.nombre.trim()}%` };
  }

  if (filtros.creditos !== undefined) {
    condiciones.creditos = filtros.creditos;
  }

  if (filtros.nivel_academico !== undefined) {
    condiciones.nivel_academico = filtros.nivel_academico;
  }

  if (filtros.activo !== undefined) {
    condiciones.activo = filtros.activo;
  }

  return condiciones;
};

const sanitizarAsignatura = (asignatura) => {
  const asignaturaPlana = typeof asignatura.get === 'function' ? asignatura.get({ plain: true }) : asignatura;
  const carrerasUnicas = [];
  const idsCarreras = new Set();
  const cursosUnicos = [];
  const idsCursos = new Set();

  (asignaturaPlana.carreras ?? []).forEach((carrera) => {
    if (!idsCarreras.has(carrera.id)) {
      idsCarreras.add(carrera.id);
      carrerasUnicas.push({
        id: carrera.id,
        codigo: carrera.codigo,
        nombre: carrera.nombre,
        activo: carrera.activo
      });
    }
  });

  (asignaturaPlana.cursos ?? []).forEach((curso) => {
    if (!idsCursos.has(curso.id)) {
      idsCursos.add(curso.id);
      cursosUnicos.push({
        id: curso.id,
        paralelo: curso.paralelo,
        aula: curso.aula,
        horario: curso.horario,
        estado: curso.estado,
        cupo_maximo: curso.cupo_maximo
      });
    }
  });

  return {
    id: asignaturaPlana.id,
    codigo: asignaturaPlana.codigo,
    nombre: asignaturaPlana.nombre,
    creditos: asignaturaPlana.creditos,
    nivel_academico: asignaturaPlana.nivel_academico,
    activo: asignaturaPlana.activo,
    created_at: asignaturaPlana.created_at,
    updated_at: asignaturaPlana.updated_at,
    carreras: carrerasUnicas,
    cursos: cursosUnicos
  };
};

export const listarAsignaturas = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await Asignatura.findAndCountAll({
    where: construirFiltrosAsignatura(filtros),
    attributes: atributosAsignatura,
    include: inclusiones,
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['codigo', 'ASC'],
      ['id', 'ASC']
    ]
  });

  return {
    data: registros.map(sanitizarAsignatura),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

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
