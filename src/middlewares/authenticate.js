import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { Sesion, Usuario } from '../models/index.js';
import { USER_STATUS } from '../constants/domain.constants.js';

const unauthorized = () => new ApiError(401, 'Token invalido o expirado.', 'INVALID_TOKEN');

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) return null;

  const [scheme, token, extra] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token || extra) {
    return null;
  }

  return token;
};

const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req.get('authorization'));

    if (!token) {
      throw unauthorized();
    }

    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    const sessionId = Number(payload.sessionId);

    if (!Number.isInteger(userId) || !Number.isInteger(sessionId)) {
      throw unauthorized();
    }

    const user = await Usuario.findByPk(userId, {
      include: [{ association: 'rol', attributes: ['id', 'codigo', 'nombre', 'activo'] }]
    });

    if (!user || user.estado !== USER_STATUS.ACTIVE || !user.rol?.activo) {
      throw unauthorized();
    }

    const session = await Sesion.findByPk(sessionId);

    if (
      !session ||
      session.usuario_id !== user.id ||
      session.revocada_en ||
      !session.fecha_expiracion ||
      session.fecha_expiracion <= new Date()
    ) {
      throw unauthorized();
    }

    req.user = {
      id: user.id,
      correo: user.correo,
      nombres: user.nombres,
      apellidos: user.apellidos,
      estado: user.estado,
      sessionId: session.id,
      rol: {
        id: user.rol.id,
        codigo: user.rol.codigo,
        nombre: user.rol.nombre
      }
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(unauthorized());
  }
};

export default authenticate;
