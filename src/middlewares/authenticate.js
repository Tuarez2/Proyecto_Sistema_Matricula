import ApiError from '../utils/ApiError.js';
import { verificarTokenAcceso } from '../utils/jwt.js';
import { Sesion, Usuario } from '../models/index.js';
import { USER_STATUS } from '../constants/domain.constants.js';

const noAutorizado = () => new ApiError(401, 'Token invalido o expirado.', 'INVALID_TOKEN');

const extraerTokenBearer = (cabeceraAutorizacion) => {
  if (!cabeceraAutorizacion) return null;

  const [esquema, token, extra] = cabeceraAutorizacion.split(' ');

  if (esquema !== 'Bearer' || !token || extra) {
    return null;
  }

  return token;
};

const authenticate = async (req, res, next) => {
  try {
    const token = extraerTokenBearer(req.get('authorization'));

    if (!token) {
      throw noAutorizado();
    }

    const datosToken = verificarTokenAcceso(token);
    const usuarioId = Number(datosToken.sub);
    const sesionId = Number(datosToken.sessionId);

    if (!Number.isInteger(usuarioId) || !Number.isInteger(sesionId)) {
      throw noAutorizado();
    }

    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{ association: 'rol', attributes: ['id', 'codigo', 'nombre', 'activo'] }]
    });

    if (!usuario || usuario.estado !== USER_STATUS.ACTIVE || !usuario.rol?.activo) {
      throw noAutorizado();
    }

    const sesion = await Sesion.findByPk(sesionId);

    if (
      !sesion ||
      sesion.usuario_id !== usuario.id ||
      sesion.revocada_en ||
      !sesion.fecha_expiracion ||
      sesion.fecha_expiracion <= new Date()
    ) {
      throw noAutorizado();
    }

    req.user = {
      id: usuario.id,
      correo: usuario.correo,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      estado: usuario.estado,
      sessionId: sesion.id,
      rol: {
        id: usuario.rol.id,
        codigo: usuario.rol.codigo,
        nombre: usuario.rol.nombre
      }
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(noAutorizado());
  }
};

export default authenticate;
