import { Op } from 'sequelize';

import { ROLE_CODES, USER_STATUS } from '../constants/domain.constants.js';
import { Docente, Estudiante, Rol, Sesion, Usuario, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizarPaginacion } from '../utils/pagination.js';
import { generarHashPassword } from '../utils/password.js';

const MENSAJE_USUARIO_NO_ENCONTRADO = 'Usuario no encontrado.';
const ESTADO_ADMIN_ACTIVO = USER_STATUS.ACTIVE;

const camposPermitidosCreacion = [
  'nombres',
  'apellidos',
  'correo',
  'password',
  'estado',
  'rol_id',
  'estudiante_id',
  'docente_id',
  'debe_cambiar_password'
];

const camposPermitidosActualizacion = [
  'nombres',
  'apellidos',
  'correo',
  'estado',
  'rol_id',
  'estudiante_id',
  'docente_id',
  'debe_cambiar_password'
];

const atributosUsuario = {
  exclude: ['password_hash']
};

const inclusionRol = {
  model: Rol,
  as: 'rol',
  attributes: ['id', 'codigo', 'nombre', 'activo']
};

const inclusionEstudiante = {
  model: Estudiante,
  as: 'estudiante',
  attributes: ['id', 'numero_matricula', 'nombres', 'apellidos', 'correo', 'estado_academico']
};

const inclusionDocente = {
  model: Docente,
  as: 'docente',
  attributes: ['id', 'identificacion', 'nombres', 'apellidos', 'correo', 'activo']
};

const inclusionesUsuario = [inclusionRol, inclusionEstudiante, inclusionDocente];

const seleccionarDatosPermitidos = (datos, camposPermitidos) =>
  camposPermitidos.reduce((datosPermitidos, campo) => {
    if (Object.prototype.hasOwnProperty.call(datos, campo) && datos[campo] !== undefined) {
      datosPermitidos[campo] = datos[campo];
    }
    return datosPermitidos;
  }, {});

const normalizarIdNullable = (valor) => (valor === null || valor === undefined ? null : Number(valor));

export const sanitizarUsuario = (usuario) => {
  if (!usuario) return null;

  const usuarioPlano = typeof usuario.get === 'function' ? usuario.get({ plain: true }) : usuario;

  return {
    id: usuarioPlano.id,
    nombres: usuarioPlano.nombres,
    apellidos: usuarioPlano.apellidos,
    correo: usuarioPlano.correo,
    estado: usuarioPlano.estado,
    rol_id: usuarioPlano.rol_id,
    estudiante_id: usuarioPlano.estudiante_id,
    docente_id: usuarioPlano.docente_id,
    debe_cambiar_password: usuarioPlano.debe_cambiar_password,
    ultimo_acceso: usuarioPlano.ultimo_acceso,
    created_at: usuarioPlano.created_at,
    updated_at: usuarioPlano.updated_at,
    rol: usuarioPlano.rol
      ? {
          id: usuarioPlano.rol.id,
          codigo: usuarioPlano.rol.codigo,
          nombre: usuarioPlano.rol.nombre,
          activo: usuarioPlano.rol.activo
        }
      : null,
    estudiante: usuarioPlano.estudiante
      ? {
          id: usuarioPlano.estudiante.id,
          numero_matricula: usuarioPlano.estudiante.numero_matricula,
          nombres: usuarioPlano.estudiante.nombres,
          apellidos: usuarioPlano.estudiante.apellidos,
          correo: usuarioPlano.estudiante.correo,
          estado_academico: usuarioPlano.estudiante.estado_academico
        }
      : null,
    docente: usuarioPlano.docente
      ? {
          id: usuarioPlano.docente.id,
          identificacion: usuarioPlano.docente.identificacion,
          nombres: usuarioPlano.docente.nombres,
          apellidos: usuarioPlano.docente.apellidos,
          correo: usuarioPlano.docente.correo,
          activo: usuarioPlano.docente.activo
        }
      : null
  };
};

const buscarUsuarioOError = async (id, opciones = {}) => {
  const usuario = await Usuario.findByPk(id, {
    attributes: atributosUsuario,
    include: inclusionesUsuario,
    ...opciones
  });

  if (!usuario) {
    throw new ApiError(404, MENSAJE_USUARIO_NO_ENCONTRADO, 'USUARIO_NOT_FOUND');
  }

  return usuario;
};

const asegurarRolExistente = async (rolId, opciones = {}) => {
  const rol = await Rol.findByPk(rolId, opciones);

  if (!rol) {
    throw new ApiError(404, 'Rol no encontrado.', 'ROL_NOT_FOUND');
  }

  if (!rol.activo) {
    throw new ApiError(400, 'El rol seleccionado no esta activo.', 'ROL_INACTIVE');
  }

  return rol;
};

const asegurarEstudianteExistente = async (estudianteId, opciones = {}) => {
  if (estudianteId === null || estudianteId === undefined) return null;

  const estudiante = await Estudiante.findByPk(estudianteId, opciones);

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  return estudiante;
};

const asegurarDocenteExistente = async (docenteId, opciones = {}) => {
  if (docenteId === null || docenteId === undefined) return null;

  const docente = await Docente.findByPk(docenteId, opciones);

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  return docente;
};

const asegurarCorreoUnico = async (correo, usuarioIdExcluido = null, opciones = {}) => {
  if (!correo) return;

  const condiciones = { correo };

  if (usuarioIdExcluido) {
    condiciones.id = { [Op.ne]: usuarioIdExcluido };
  }

  const usuarioExistente = await Usuario.findOne({ where: condiciones, ...opciones });

  if (usuarioExistente) {
    throw new ApiError(409, 'El correo ya esta registrado.', 'USUARIO_CORREO_DUPLICATED');
  }
};

const asegurarRelacionUnica = async (campo, valor, usuarioIdExcluido = null, opciones = {}) => {
  if (valor === null || valor === undefined) return;

  const condiciones = { [campo]: valor };

  if (usuarioIdExcluido) {
    condiciones.id = { [Op.ne]: usuarioIdExcluido };
  }

  const usuarioExistente = await Usuario.findOne({ where: condiciones, ...opciones });

  if (usuarioExistente) {
    throw new ApiError(409, 'La relacion ya esta asociada a otro usuario.', 'USUARIO_RELACION_DUPLICATED', {
      field: campo
    });
  }
};

const contarAdministradoresActivos = (opciones = {}) =>
  Usuario.count({
    where: { estado: ESTADO_ADMIN_ACTIVO },
    include: [
      {
        model: Rol,
        as: 'rol',
        where: { codigo: ROLE_CODES.ADMIN },
        attributes: []
      }
    ],
    ...opciones
  });

const asegurarAdministradorActivoSistema = async (usuario, datosPermitidos, opciones = {}) => {
  const rolActual = usuario.rol;

  if (rolActual?.codigo !== ROLE_CODES.ADMIN || usuario.estado !== ESTADO_ADMIN_ACTIVO) {
    return;
  }

  let rolSiguiente = rolActual;

  if (Object.prototype.hasOwnProperty.call(datosPermitidos, 'rol_id') && datosPermitidos.rol_id !== usuario.rol_id) {
    rolSiguiente = await asegurarRolExistente(datosPermitidos.rol_id, opciones);
  }

  const estadoSiguiente = Object.prototype.hasOwnProperty.call(datosPermitidos, 'estado') ? datosPermitidos.estado : usuario.estado;
  const mantieneAdminActivo = estadoSiguiente === ESTADO_ADMIN_ACTIVO && rolSiguiente.codigo === ROLE_CODES.ADMIN;

  if (mantieneAdminActivo) {
    return;
  }

  const administradoresActivos = await contarAdministradoresActivos(opciones);

  if (administradoresActivos <= 1) {
    throw new ApiError(409, 'No se puede dejar el sistema sin administradores activos.', 'LAST_ACTIVE_ADMIN');
  }
};

const validarRelacionesDatos = async (datosPermitidos, usuarioIdExcluido = null, opciones = {}) => {
  if (Object.prototype.hasOwnProperty.call(datosPermitidos, 'rol_id')) {
    await asegurarRolExistente(datosPermitidos.rol_id, opciones);
  }

  if (Object.prototype.hasOwnProperty.call(datosPermitidos, 'estudiante_id')) {
    const estudianteId = normalizarIdNullable(datosPermitidos.estudiante_id);
    datosPermitidos.estudiante_id = estudianteId;
    await asegurarEstudianteExistente(estudianteId, opciones);
    await asegurarRelacionUnica('estudiante_id', estudianteId, usuarioIdExcluido, opciones);
  }

  if (Object.prototype.hasOwnProperty.call(datosPermitidos, 'docente_id')) {
    const docenteId = normalizarIdNullable(datosPermitidos.docente_id);
    datosPermitidos.docente_id = docenteId;
    await asegurarDocenteExistente(docenteId, opciones);
    await asegurarRelacionUnica('docente_id', docenteId, usuarioIdExcluido, opciones);
  }
};

const revocarSesionesUsuario = async (usuarioId, opciones = {}) =>
  Sesion.update(
    { revocada_en: new Date() },
    {
      where: {
        usuario_id: usuarioId,
        revocada_en: { [Op.is]: null }
      },
      ...opciones
    }
  );

export const listarUsuarios = async (filtros = {}) => {
  const { page: pagina, limit: limite, offset: desplazamiento } = normalizarPaginacion(filtros.page, filtros.limit);
  const condiciones = {};
  const inclusiones = [...inclusionesUsuario];

  if (filtros.correo) {
    condiciones.correo = { [Op.like]: `%${filtros.correo}%` };
  }

  if (filtros.estado) {
    condiciones.estado = filtros.estado;
  }

  if (filtros.rol) {
    const filtroRol = Number.isInteger(Number(filtros.rol))
      ? { id: Number(filtros.rol) }
      : { codigo: filtros.rol };

    inclusiones[0] = {
      ...inclusionRol,
      where: filtroRol
    };
  }

  const { rows: registros, count: totalRegistros } = await Usuario.findAndCountAll({
    where: condiciones,
    attributes: atributosUsuario,
    include: inclusiones,
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
    data: registros.map(sanitizarUsuario),
    page: pagina,
    limit: limite,
    total: totalRegistros,
    totalPages: Math.ceil(totalRegistros / limite)
  };
};

export const obtenerUsuarioPorId = async (id) => sanitizarUsuario(await buscarUsuarioOError(id));

export const crearUsuario = async (datos) =>
  sequelize.transaction(async (transaction) => {
    const datosPermitidos = seleccionarDatosPermitidos(datos, camposPermitidosCreacion);

    await asegurarCorreoUnico(datosPermitidos.correo, null, { transaction });
    await validarRelacionesDatos(datosPermitidos, null, { transaction });

    const password_hash = await generarHashPassword(datosPermitidos.password);
    delete datosPermitidos.password;

    const usuario = await Usuario.create(
      {
        ...datosPermitidos,
        password_hash
      },
      { transaction }
    );

    return sanitizarUsuario(
      await Usuario.findByPk(usuario.id, {
        attributes: atributosUsuario,
        include: inclusionesUsuario,
        transaction
      })
    );
  });

export const actualizarUsuario = async (id, datos, usuarioAutenticadoId) =>
  sequelize.transaction(async (transaction) => {
    const usuario = await buscarUsuarioOError(id, { transaction });
    const datosPermitidos = seleccionarDatosPermitidos(datos, camposPermitidosActualizacion);

    if (Object.keys(datosPermitidos).length === 0) {
      throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
    }

    if (
      usuario.id === usuarioAutenticadoId &&
      Object.prototype.hasOwnProperty.call(datosPermitidos, 'estado') &&
      datosPermitidos.estado !== ESTADO_ADMIN_ACTIVO
    ) {
      throw new ApiError(409, 'No puede desactivar su propio usuario administrativo.', 'SELF_DEACTIVATION_NOT_ALLOWED');
    }

    await asegurarAdministradorActivoSistema(usuario, datosPermitidos, { transaction });
    await asegurarCorreoUnico(datosPermitidos.correo, usuario.id, { transaction });
    await validarRelacionesDatos(datosPermitidos, usuario.id, { transaction });

    await usuario.update(datosPermitidos, { transaction });

    if (
      Object.prototype.hasOwnProperty.call(datosPermitidos, 'estado') &&
      datosPermitidos.estado !== ESTADO_ADMIN_ACTIVO
    ) {
      await revocarSesionesUsuario(usuario.id, { transaction });
    }

    return sanitizarUsuario(
      await Usuario.findByPk(usuario.id, {
        attributes: atributosUsuario,
        include: inclusionesUsuario,
        transaction
      })
    );
  });

export const cambiarEstadoUsuario = async (id, estado, usuarioAutenticadoId) =>
  sequelize.transaction(async (transaction) => {
    const usuario = await buscarUsuarioOError(id, { transaction });
    const datosPermitidos = { estado };

    if (usuario.id === usuarioAutenticadoId && estado !== ESTADO_ADMIN_ACTIVO) {
      throw new ApiError(409, 'No puede desactivar su propio usuario administrativo.', 'SELF_DEACTIVATION_NOT_ALLOWED');
    }

    await asegurarAdministradorActivoSistema(usuario, datosPermitidos, { transaction });

    if (usuario.estado === estado) {
      return sanitizarUsuario(usuario);
    }

    await usuario.update(datosPermitidos, { transaction });

    if (estado !== ESTADO_ADMIN_ACTIVO) {
      await revocarSesionesUsuario(usuario.id, { transaction });
    }

    return sanitizarUsuario(
      await Usuario.findByPk(usuario.id, {
        attributes: atributosUsuario,
        include: inclusionesUsuario,
        transaction
      })
    );
  });

export const cambiarPasswordUsuario = async (id, password) =>
  sequelize.transaction(async (transaction) => {
    const usuario = await buscarUsuarioOError(id, { transaction });
    const password_hash = await generarHashPassword(password);

    await usuario.update(
      {
        password_hash,
        debe_cambiar_password: false
      },
      { transaction }
    );
    await revocarSesionesUsuario(usuario.id, { transaction });

    return sanitizarUsuario(
      await Usuario.findByPk(usuario.id, {
        attributes: atributosUsuario,
        include: inclusionesUsuario,
        transaction
      })
    );
  });

export default {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
  sanitizarUsuario
};
