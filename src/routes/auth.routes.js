import { Router } from 'express';

import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import authenticate from '../middlewares/authenticate.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import ApiError from '../utils/ApiError.js';
import { validarLogin, validarRefresh } from '../validators/auth.validator.js';

const router = Router();

const cubetas = new Map();

const limitarTasa = ({ limite, ventanaMs }) => (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ahora = Date.now();
  const clave = `${req.ip}:${req.path}`;
  const cubeta = cubetas.get(clave);

  if (!cubeta || cubeta.reiniciaEn <= ahora) {
    cubetas.set(clave, { conteo: 1, reiniciaEn: ahora + ventanaMs });
    return next();
  }

  if (cubeta.conteo >= limite) {
    return next(new ApiError(429, 'Demasiados intentos. Intente nuevamente mas tarde.', 'TOO_MANY_REQUESTS'));
  }

  cubeta.conteo += 1;
  return next();
};

const limitadorLogin = limitarTasa({ limite: 5, ventanaMs: 15 * 60 * 1000 });
const limitadorRefresh = limitarTasa({ limite: 20, ventanaMs: 15 * 60 * 1000 });

router.post('/login', limitadorLogin, validarLogin, validarSolicitud, login);
router.post('/refresh', limitadorRefresh, validarRefresh, validarSolicitud, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
