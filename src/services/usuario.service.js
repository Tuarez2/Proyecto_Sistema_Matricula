import { Op } from 'sequelize';

import { ROLE_CODES, USER_STATUS } from '../constants/domain.constants.js';
import { Docente, Estudiante, Rol, Sesion, Usuario, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizePagination } from '../utils/pagination.js';
import { hashPassword } from '../utils/password.js';

const USER_NOT_FOUND = 'Usuario no encontrado.';
const ACTIVE_ADMIN_STATUS = USER_STATUS.ACTIVE;

const allowedCreateFields = [
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

const allowedUpdateFields = [
  'nombres',
  'apellidos',
  'correo',
  'estado',
  'rol_id',
  'estudiante_id',
  'docente_id',
  'debe_cambiar_password'
];

const userAttributes = {
  exclude: ['password_hash']
};

const roleInclude = {
  model: Rol,
  as: 'rol',
  attributes: ['id', 'codigo', 'nombre', 'activo']
};

const estudianteInclude = {
  model: Estudiante,
  as: 'estudiante',
  attributes: ['id', 'numero_matricula', 'nombres', 'apellidos', 'correo', 'estado_academico']
};

const docenteInclude = {
  model: Docente,
  as: 'docente',
  attributes: ['id', 'identificacion', 'nombres', 'apellidos', 'correo', 'activo']
};

const userInclude = [roleInclude, estudianteInclude, docenteInclude];

const pickPayload = (data, allowedFields) =>
  allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined) {
      payload[field] = data[field];
    }
    return payload;
  }, {});

const normalizeNullableId = (value) => (value === null || value === undefined ? null : Number(value));

export const sanitizeUser = (user) => {
  if (!user) return null;

  const plainUser = typeof user.get === 'function' ? user.get({ plain: true }) : user;

  return {
    id: plainUser.id,
    nombres: plainUser.nombres,
    apellidos: plainUser.apellidos,
    correo: plainUser.correo,
    estado: plainUser.estado,
    rol_id: plainUser.rol_id,
    estudiante_id: plainUser.estudiante_id,
    docente_id: plainUser.docente_id,
    debe_cambiar_password: plainUser.debe_cambiar_password,
    ultimo_acceso: plainUser.ultimo_acceso,
    created_at: plainUser.created_at,
    updated_at: plainUser.updated_at,
    rol: plainUser.rol
      ? {
          id: plainUser.rol.id,
          codigo: plainUser.rol.codigo,
          nombre: plainUser.rol.nombre,
          activo: plainUser.rol.activo
        }
      : null,
    estudiante: plainUser.estudiante
      ? {
          id: plainUser.estudiante.id,
          numero_matricula: plainUser.estudiante.numero_matricula,
          nombres: plainUser.estudiante.nombres,
          apellidos: plainUser.estudiante.apellidos,
          correo: plainUser.estudiante.correo,
          estado_academico: plainUser.estudiante.estado_academico
        }
      : null,
    docente: plainUser.docente
      ? {
          id: plainUser.docente.id,
          identificacion: plainUser.docente.identificacion,
          nombres: plainUser.docente.nombres,
          apellidos: plainUser.docente.apellidos,
          correo: plainUser.docente.correo,
          activo: plainUser.docente.activo
        }
      : null
  };
};

const findUserOrFail = async (id, options = {}) => {
  const user = await Usuario.findByPk(id, {
    attributes: userAttributes,
    include: userInclude,
    ...options
  });

  if (!user) {
    throw new ApiError(404, USER_NOT_FOUND, 'USUARIO_NOT_FOUND');
  }

  return user;
};

const ensureRoleExists = async (rolId, options = {}) => {
  const role = await Rol.findByPk(rolId, options);

  if (!role) {
    throw new ApiError(404, 'Rol no encontrado.', 'ROL_NOT_FOUND');
  }

  if (!role.activo) {
    throw new ApiError(400, 'El rol seleccionado no esta activo.', 'ROL_INACTIVE');
  }

  return role;
};

const ensureEstudianteExists = async (estudianteId, options = {}) => {
  if (estudianteId === null || estudianteId === undefined) return null;

  const estudiante = await Estudiante.findByPk(estudianteId, options);

  if (!estudiante) {
    throw new ApiError(404, 'Estudiante no encontrado.', 'ESTUDIANTE_NOT_FOUND');
  }

  return estudiante;
};

const ensureDocenteExists = async (docenteId, options = {}) => {
  if (docenteId === null || docenteId === undefined) return null;

  const docente = await Docente.findByPk(docenteId, options);

  if (!docente) {
    throw new ApiError(404, 'Docente no encontrado.', 'DOCENTE_NOT_FOUND');
  }

  return docente;
};

const ensureUniqueCorreo = async (correo, excludeUserId = null, options = {}) => {
  if (!correo) return;

  const where = { correo };

  if (excludeUserId) {
    where.id = { [Op.ne]: excludeUserId };
  }

  const existingUser = await Usuario.findOne({ where, ...options });

  if (existingUser) {
    throw new ApiError(409, 'El correo ya esta registrado.', 'USUARIO_CORREO_DUPLICATED');
  }
};

const ensureUniqueRelation = async (field, value, excludeUserId = null, options = {}) => {
  if (value === null || value === undefined) return;

  const where = { [field]: value };

  if (excludeUserId) {
    where.id = { [Op.ne]: excludeUserId };
  }

  const existingUser = await Usuario.findOne({ where, ...options });

  if (existingUser) {
    throw new ApiError(409, 'La relacion ya esta asociada a otro usuario.', 'USUARIO_RELACION_DUPLICATED', {
      field
    });
  }
};

const countActiveAdmins = (options = {}) =>
  Usuario.count({
    where: { estado: ACTIVE_ADMIN_STATUS },
    include: [
      {
        model: Rol,
        as: 'rol',
        where: { codigo: ROLE_CODES.ADMIN },
        attributes: []
      }
    ],
    ...options
  });

const ensureSystemKeepsActiveAdmin = async (user, payload, options = {}) => {
  const currentRole = user.rol;

  if (currentRole?.codigo !== ROLE_CODES.ADMIN || user.estado !== ACTIVE_ADMIN_STATUS) {
    return;
  }

  let nextRole = currentRole;

  if (Object.prototype.hasOwnProperty.call(payload, 'rol_id') && payload.rol_id !== user.rol_id) {
    nextRole = await ensureRoleExists(payload.rol_id, options);
  }

  const nextEstado = Object.prototype.hasOwnProperty.call(payload, 'estado') ? payload.estado : user.estado;
  const remainsActiveAdmin = nextEstado === ACTIVE_ADMIN_STATUS && nextRole.codigo === ROLE_CODES.ADMIN;

  if (remainsActiveAdmin) {
    return;
  }

  const activeAdmins = await countActiveAdmins(options);

  if (activeAdmins <= 1) {
    throw new ApiError(409, 'No se puede dejar el sistema sin administradores activos.', 'LAST_ACTIVE_ADMIN');
  }
};

const validatePayloadRelations = async (payload, excludeUserId = null, options = {}) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'rol_id')) {
    await ensureRoleExists(payload.rol_id, options);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'estudiante_id')) {
    const estudianteId = normalizeNullableId(payload.estudiante_id);
    payload.estudiante_id = estudianteId;
    await ensureEstudianteExists(estudianteId, options);
    await ensureUniqueRelation('estudiante_id', estudianteId, excludeUserId, options);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'docente_id')) {
    const docenteId = normalizeNullableId(payload.docente_id);
    payload.docente_id = docenteId;
    await ensureDocenteExists(docenteId, options);
    await ensureUniqueRelation('docente_id', docenteId, excludeUserId, options);
  }
};

const revokeUserSessions = async (userId, options = {}) =>
  Sesion.update(
    { revocada_en: new Date() },
    {
      where: {
        usuario_id: userId,
        revocada_en: { [Op.is]: null }
      },
      ...options
    }
  );

export const listarUsuarios = async (filters = {}) => {
  const { page, limit, offset } = normalizePagination(filters.page, filters.limit);
  const where = {};
  const include = [...userInclude];

  if (filters.correo) {
    where.correo = { [Op.like]: `%${filters.correo}%` };
  }

  if (filters.estado) {
    where.estado = filters.estado;
  }

  if (filters.rol) {
    const roleFilter = Number.isInteger(Number(filters.rol))
      ? { id: Number(filters.rol) }
      : { codigo: filters.rol };

    include[0] = {
      ...roleInclude,
      where: roleFilter
    };
  }

  const { rows, count } = await Usuario.findAndCountAll({
    where,
    attributes: userAttributes,
    include,
    distinct: true,
    limit,
    offset,
    order: [
      ['apellidos', 'ASC'],
      ['nombres', 'ASC'],
      ['id', 'ASC']
    ]
  });

  return {
    data: rows.map(sanitizeUser),
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit)
  };
};

export const obtenerUsuarioPorId = async (id) => sanitizeUser(await findUserOrFail(id));

export const crearUsuario = async (data) =>
  sequelize.transaction(async (transaction) => {
    const payload = pickPayload(data, allowedCreateFields);

    await ensureUniqueCorreo(payload.correo, null, { transaction });
    await validatePayloadRelations(payload, null, { transaction });

    const password_hash = await hashPassword(payload.password);
    delete payload.password;

    const user = await Usuario.create(
      {
        ...payload,
        password_hash
      },
      { transaction }
    );

    return sanitizeUser(
      await Usuario.findByPk(user.id, {
        attributes: userAttributes,
        include: userInclude,
        transaction
      })
    );
  });

export const actualizarUsuario = async (id, data, authenticatedUserId) =>
  sequelize.transaction(async (transaction) => {
    const user = await findUserOrFail(id, { transaction });
    const payload = pickPayload(data, allowedUpdateFields);

    if (Object.keys(payload).length === 0) {
      throw new ApiError(400, 'Debe enviar al menos un campo valido.', 'EMPTY_UPDATE_PAYLOAD');
    }

    if (
      user.id === authenticatedUserId &&
      Object.prototype.hasOwnProperty.call(payload, 'estado') &&
      payload.estado !== ACTIVE_ADMIN_STATUS
    ) {
      throw new ApiError(409, 'No puede desactivar su propio usuario administrativo.', 'SELF_DEACTIVATION_NOT_ALLOWED');
    }

    await ensureSystemKeepsActiveAdmin(user, payload, { transaction });
    await ensureUniqueCorreo(payload.correo, user.id, { transaction });
    await validatePayloadRelations(payload, user.id, { transaction });

    await user.update(payload, { transaction });

    if (
      Object.prototype.hasOwnProperty.call(payload, 'estado') &&
      user.estado !== ACTIVE_ADMIN_STATUS
    ) {
      await revokeUserSessions(user.id, { transaction });
    }

    return sanitizeUser(
      await Usuario.findByPk(user.id, {
        attributes: userAttributes,
        include: userInclude,
        transaction
      })
    );
  });

export const cambiarEstadoUsuario = async (id, estado, authenticatedUserId) =>
  sequelize.transaction(async (transaction) => {
    const user = await findUserOrFail(id, { transaction });
    const payload = { estado };

    if (user.id === authenticatedUserId && estado !== ACTIVE_ADMIN_STATUS) {
      throw new ApiError(409, 'No puede desactivar su propio usuario administrativo.', 'SELF_DEACTIVATION_NOT_ALLOWED');
    }

    await ensureSystemKeepsActiveAdmin(user, payload, { transaction });

    if (user.estado === estado) {
      return sanitizeUser(user);
    }

    await user.update(payload, { transaction });

    if (estado !== ACTIVE_ADMIN_STATUS) {
      await revokeUserSessions(user.id, { transaction });
    }

    return sanitizeUser(
      await Usuario.findByPk(user.id, {
        attributes: userAttributes,
        include: userInclude,
        transaction
      })
    );
  });

export const cambiarPasswordUsuario = async (id, password) =>
  sequelize.transaction(async (transaction) => {
    const user = await findUserOrFail(id, { transaction });
    const password_hash = await hashPassword(password);

    await user.update(
      {
        password_hash,
        debe_cambiar_password: false
      },
      { transaction }
    );
    await revokeUserSessions(user.id, { transaction });

    return sanitizeUser(
      await Usuario.findByPk(user.id, {
        attributes: userAttributes,
        include: userInclude,
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
  sanitizeUser
};
