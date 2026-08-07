import { Op } from 'sequelize';

import { ACADEMIC_PERIOD_STATUS } from '../constants/domain.constants.js';
import { Curso, Matricula, PeriodoAcademico, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';

const MENSAJE_PERIODO_NO_ENCONTRADO = 'Periodo academico no encontrado.';

const ESTADOS_PERIODO = Object.values(ACADEMIC_PERIOD_STATUS);
const ESTADOS_OPERATIVOS = [ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN, ACADEMIC_PERIOD_STATUS.IN_PROGRESS];
const camposPermitidosCreacion = [
  'codigo',
  'nombre',
  'fecha_inicio',
  'fecha_fin',
  'fecha_inicio_matricula',
  'fecha_fin_matricula',
  'estado'
];
const camposPermitidosActualizacion = [
  'codigo',
  'nombre',
  'fecha_inicio',
  'fecha_fin',
  'fecha_inicio_matricula',
  'fecha_fin_matricula'
];
const camposFecha = ['fecha_inicio', 'fecha_fin', 'fecha_inicio_matricula', 'fecha_fin_matricula'];
const atributosPeriodo = [
  'id',
  'codigo',
  'nombre',
  'fecha_inicio',
  'fecha_fin',
  'fecha_inicio_matricula',
  'fecha_fin_matricula',
  'estado',
  'created_at',
  'updated_at'
];
const atributosCurso = ['id', 'paralelo', 'aula', 'horario', 'cupo_maximo', 'estado', 'asignatura_id', 'docente_id'];

const transicionesPermitidas = {
  [ACADEMIC_PERIOD_STATUS.PLANNED]: [ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN, ACADEMIC_PERIOD_STATUS.CLOSED],
  [ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN]: [ACADEMIC_PERIOD_STATUS.IN_PROGRESS, ACADEMIC_PERIOD_STATUS.CLOSED],
  [ACADEMIC_PERIOD_STATUS.IN_PROGRESS]: [ACADEMIC_PERIOD_STATUS.CLOSED],
  [ACADEMIC_PERIOD_STATUS.CLOSED]: []
};

const seleccionarDatosPermitidos = (datos, camposPermitidos) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(datos, campo) && datos[campo] !== undefined) {
      datosPermitidos[campo] = datos[campo];
    }
    return datosPermitidos;
  }, {});

const normalizarCodigo = (codigo) => codigo.trim().toUpperCase();
const normalizarNombre = (nombre) => nombre.trim().replace(/\s+/g, ' ');

const normalizarDatosPeriodo = (datosPeriodo) => {
  const datosNormalizados = { ...datosPeriodo };

  if (datosNormalizados.codigo !== undefined) {
    datosNormalizados.codigo = normalizarCodigo(datosNormalizados.codigo);
  }

  if (datosNormalizados.nombre !== undefined) {
    datosNormalizados.nombre = normalizarNombre(datosNormalizados.nombre);
  }

  return datosNormalizados;
};

const fechaInicioDia = (valor) => new Date(`${valor}T00:00:00.000Z`);
const fechaFinDia = (valor) => new Date(`${valor}T23:59:59.999Z`);
const fechaHora = (valor) => new Date(valor);
const fechaValida = (fecha) => fecha instanceof Date && !Number.isNaN(fecha.getTime());

const sanitizarPeriodo = (periodo) => {
  if (!periodo) return null;

  const periodoPlano = typeof periodo.get === 'function' ? periodo.get({ plain: true }) : periodo;

  return {
    id: periodoPlano.id,
    codigo: periodoPlano.codigo,
    nombre: periodoPlano.nombre,
    fecha_inicio: periodoPlano.fecha_inicio,
    fecha_fin: periodoPlano.fecha_fin,
    fecha_inicio_matricula: periodoPlano.fecha_inicio_matricula,
    fecha_fin_matricula: periodoPlano.fecha_fin_matricula,
    estado: periodoPlano.estado,
    created_at: periodoPlano.created_at,
    updated_at: periodoPlano.updated_at,
    cursos: Array.isArray(periodoPlano.cursos)
      ? periodoPlano.cursos.map((curso) => ({
          id: curso.id,
          paralelo: curso.paralelo,
          aula: curso.aula,
          horario: curso.horario,
          cupo_maximo: curso.cupo_maximo,
          estado: curso.estado,
          asignatura_id: curso.asignatura_id,
          docente_id: curso.docente_id
        }))
      : undefined
  };
};

const buscarPeriodoOError = async (id, opciones = {}) => {
  const periodo = await PeriodoAcademico.findByPk(id, opciones);

  if (!periodo) {
    throw new ApiError(404, MENSAJE_PERIODO_NO_ENCONTRADO, 'PERIODO_ACADEMICO_NOT_FOUND');
  }

  return periodo;
};

const asegurarCodigoUnico = async (codigo, periodoIdExcluido = null, opciones = {}) => {
  if (!codigo) return;

  const condiciones = { codigo };

  if (periodoIdExcluido) {
    condiciones.id = { [Op.ne]: periodoIdExcluido };
  }

  const periodoExistente = await PeriodoAcademico.findOne({ where: condiciones, ...opciones });

  if (periodoExistente) {
    throw new ApiError(409, 'El codigo de periodo academico ya esta registrado.', 'PERIODO_CODIGO_DUPLICATED');
  }
};

const construirPeriodoConDatos = (periodo, datosPermitidos = {}) => {
  const periodoPlano = typeof periodo.get === 'function' ? periodo.get({ plain: true }) : periodo;

  return {
    codigo: datosPermitidos.codigo ?? periodoPlano.codigo,
    nombre: datosPermitidos.nombre ?? periodoPlano.nombre,
    fecha_inicio: datosPermitidos.fecha_inicio ?? periodoPlano.fecha_inicio,
    fecha_fin: datosPermitidos.fecha_fin ?? periodoPlano.fecha_fin,
    fecha_inicio_matricula: datosPermitidos.fecha_inicio_matricula ?? periodoPlano.fecha_inicio_matricula,
    fecha_fin_matricula: datosPermitidos.fecha_fin_matricula ?? periodoPlano.fecha_fin_matricula,
    estado: datosPermitidos.estado ?? periodoPlano.estado
  };
};

const verificarFechasPeriodo = (datosPeriodo) => {
  const inicioPeriodo = fechaInicioDia(datosPeriodo.fecha_inicio);
  const finPeriodo = fechaFinDia(datosPeriodo.fecha_fin);
  const inicioMatricula = fechaHora(datosPeriodo.fecha_inicio_matricula);
  const finMatricula = fechaHora(datosPeriodo.fecha_fin_matricula);

  if (![inicioPeriodo, finPeriodo, inicioMatricula, finMatricula].every(fechaValida)) {
    throw new ApiError(400, 'Las fechas del periodo academico no son validas.', 'PERIODO_FECHAS_INVALIDAS');
  }

  if (inicioPeriodo >= finPeriodo) {
    throw new ApiError(400, 'La fecha de inicio debe ser anterior a la fecha de fin.', 'PERIODO_RANGO_INVALIDO');
  }

  if (inicioMatricula >= finMatricula) {
    throw new ApiError(
      400,
      'La fecha de inicio de matricula debe ser anterior a la fecha de fin de matricula.',
      'PERIODO_MATRICULA_RANGO_INVALIDO'
    );
  }

  if (inicioMatricula < inicioPeriodo || finMatricula > finPeriodo) {
    throw new ApiError(
      400,
      'La ventana de matricula debe estar dentro del periodo academico.',
      'PERIODO_MATRICULA_FUERA_DE_RANGO'
    );
  }
};

const asegurarPeriodoOperativoUnico = async (estado, periodoIdExcluido = null, opciones = {}) => {
  if (!ESTADOS_OPERATIVOS.includes(estado)) return;

  const condiciones = {
    estado: { [Op.in]: ESTADOS_OPERATIVOS }
  };

  if (periodoIdExcluido) {
    condiciones.id = { [Op.ne]: periodoIdExcluido };
  }

  const periodoOperativo = await PeriodoAcademico.findOne({
    where: condiciones,
    transaction: opciones.transaction,
    lock: opciones.transaction?.LOCK?.UPDATE
  });

  if (periodoOperativo) {
    throw new ApiError(
      409,
      'Ya existe un periodo academico en matricula abierta o en curso.',
      'PERIODO_OPERATIVO_DUPLICATED'
    );
  }
};

const asegurarPeriodoNoSolapado = async ({ fecha_inicio, fecha_fin }, periodoIdExcluido = null, opciones = {}) => {
  if (!fecha_inicio || !fecha_fin) return;

  const condiciones = {
    [Op.and]: [{ fecha_inicio: { [Op.lte]: fecha_fin } }, { fecha_fin: { [Op.gte]: fecha_inicio } }]
  };

  if (periodoIdExcluido) {
    condiciones.id = { [Op.ne]: periodoIdExcluido };
  }

  const periodoSolapado = await PeriodoAcademico.findOne({
    where: condiciones,
    transaction: opciones.transaction
  });

  if (periodoSolapado) {
    throw new ApiError(
      409,
      'Las fechas del periodo academico se superponen con otro periodo existente.',
      'PERIODO_FECHAS_SOLAPADAS'
    );
  }
};

const contarDependenciasPeriodo = async (periodoId, opciones = {}) => {
  const cursos = await Curso.findAll({
    where: { periodo_id: periodoId },
    attributes: ['id'],
    ...opciones
  });
  const cursoIds = cursos.map((curso) => curso.id);

  if (cursoIds.length === 0) {
    return { cursos: 0, matriculas: 0 };
  }

  const matriculas = await Matricula.count({
    where: { curso_id: { [Op.in]: cursoIds } },
    ...opciones
  });

  return { cursos: cursoIds.length, matriculas };
};

const asegurarFechasModificables = async (periodoId, datosPermitidos, opciones = {}) => {
  const modificaFechas = camposFecha.some((campo) => Object.prototype.hasOwnProperty.call(datosPermitidos, campo));

  if (!modificaFechas) return;

  const dependencias = await contarDependenciasPeriodo(periodoId, opciones);

  if (dependencias.cursos > 0 || dependencias.matriculas > 0) {
    throw new ApiError(
      409,
      'No se pueden modificar fechas de un periodo academico que ya tiene cursos o matriculas asociados.',
      'PERIODO_FECHAS_CON_DEPENDENCIAS',
      dependencias
    );
  }
};

const asegurarTransicionPermitida = (estadoActual, estadoSiguiente) => {
  if (estadoActual === estadoSiguiente) return;

  if (!transicionesPermitidas[estadoActual]?.includes(estadoSiguiente)) {
    throw new ApiError(
      409,
      'La transicion de estado del periodo academico no esta permitida.',
      'PERIODO_TRANSICION_INVALIDA',
      { estadoActual, estadoSiguiente }
    );
  }
};

const construirFiltrosPeriodo = (filtros = {}) => {
  const condiciones = {};

  if (filtros.codigo) {
    condiciones.codigo = { [Op.like]: `%${filtros.codigo.trim().toUpperCase()}%` };
  }

  if (filtros.nombre) {
    condiciones.nombre = { [Op.like]: `%${filtros.nombre.trim()}%` };
  }

  if (filtros.estado) {
    condiciones.estado = filtros.estado;
  }

  if (filtros.fecha_inicio) {
    condiciones.fecha_inicio = { ...(condiciones.fecha_inicio ?? {}), [Op.gte]: filtros.fecha_inicio };
  }

  if (filtros.fecha_fin) {
    condiciones.fecha_fin = { ...(condiciones.fecha_fin ?? {}), [Op.lte]: filtros.fecha_fin };
  }

  if (filtros.anio) {
    condiciones.fecha_inicio = {
      ...(condiciones.fecha_inicio ?? {}),
      [Op.gte]: `${filtros.anio}-01-01`,
      [Op.lte]: `${filtros.anio}-12-31`
    };
  }

  return condiciones;
};

export const listarPeriodosAcademicos = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);

  const { rows: registros, count: totalRegistros } = await PeriodoAcademico.findAndCountAll({
    where: construirFiltrosPeriodo(filtros),
    attributes: atributosPeriodo,
    distinct: true,
    limit: limite,
    offset: desplazamiento,
    order: [
      ['fecha_inicio', 'DESC'],
      ['id', 'DESC']
    ]
  });

  return {
    data: registros.map(sanitizarPeriodo),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerPeriodoPorId = async (id) => {
  const periodo = await buscarPeriodoOError(id, {
    attributes: atributosPeriodo,
    include: [
      {
        model: Curso,
        as: 'cursos',
        attributes: atributosCurso
      }
    ],
    order: [[{ model: Curso, as: 'cursos' }, 'id', 'ASC']]
  });

  return sanitizarPeriodo(periodo);
};

export const crearPeriodoAcademico = async (datos) =>
  sequelize.transaction(async (transaction) => {
    const datosPermitidos = normalizarDatosPeriodo(seleccionarDatosPermitidos(datos, camposPermitidosCreacion));

    if (!datosPermitidos.estado) {
      datosPermitidos.estado = ACADEMIC_PERIOD_STATUS.PLANNED;
    }

    verificarFechasPeriodo(datosPermitidos);
    await asegurarCodigoUnico(datosPermitidos.codigo, null, { transaction });
    await asegurarPeriodoOperativoUnico(datosPermitidos.estado, null, { transaction });
    await asegurarPeriodoNoSolapado(datosPermitidos, null, { transaction });

    const periodo = await PeriodoAcademico.create(datosPermitidos, { transaction });

    return sanitizarPeriodo(
      await PeriodoAcademico.findByPk(periodo.id, {
        attributes: atributosPeriodo,
        transaction
      })
    );
  });

export const actualizarPeriodoAcademico = async (id, datos) =>
  sequelize.transaction(async (transaction) => {
    const periodo = await buscarPeriodoOError(id, { transaction });
    const datosPermitidos = normalizarDatosPeriodo(seleccionarDatosPermitidos(datos, camposPermitidosActualizacion));

    if (Object.keys(datosPermitidos).length === 0) {
      throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
    }

    verificarFechasPeriodo(construirPeriodoConDatos(periodo, datosPermitidos));
    await asegurarFechasModificables(periodo.id, datosPermitidos, { transaction });
    await asegurarCodigoUnico(datosPermitidos.codigo, periodo.id, { transaction });

    if (datosPermitidos.fecha_inicio !== undefined || datosPermitidos.fecha_fin !== undefined) {
      await asegurarPeriodoNoSolapado(construirPeriodoConDatos(periodo, datosPermitidos), periodo.id, { transaction });
    }

    await periodo.update(datosPermitidos, { transaction });

    return sanitizarPeriodo(
      await PeriodoAcademico.findByPk(periodo.id, {
        attributes: atributosPeriodo,
        transaction
      })
    );
  });

export const cambiarEstadoPeriodo = async (id, estado) =>
  sequelize.transaction(async (transaction) => {
    const periodo = await buscarPeriodoOError(id, { transaction, lock: transaction.LOCK.UPDATE });

    if (periodo.estado === estado) {
      return sanitizarPeriodo(periodo);
    }

    asegurarTransicionPermitida(periodo.estado, estado);
    await asegurarPeriodoOperativoUnico(estado, periodo.id, { transaction });

    await periodo.update({ estado }, { transaction });

    return sanitizarPeriodo(
      await PeriodoAcademico.findByPk(periodo.id, {
        attributes: atributosPeriodo,
        transaction
      })
    );
  });

export default {
  listarPeriodosAcademicos,
  obtenerPeriodoPorId,
  crearPeriodoAcademico,
  actualizarPeriodoAcademico,
  cambiarEstadoPeriodo
};
