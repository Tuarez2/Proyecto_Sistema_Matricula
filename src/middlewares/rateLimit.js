import rateLimit from 'express-rate-limit';

import environment from '../config/environment.js';

const mensajeDemasiadasSolicitudes = 'Demasiadas solicitudes. Intente nuevamente mas tarde.';

const construirLimitador = ({ ventanaMs, maximo }) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const reinicio = req.rateLimit?.resetTime;

      if (reinicio instanceof Date) {
        const segundos = Math.max(1, Math.ceil((reinicio.getTime() - Date.now()) / 1000));
        res.set('Retry-After', String(segundos));
      }

      return res.status(429).json({
        success: false,
        message: mensajeDemasiadasSolicitudes,
        code: 'TOO_MANY_REQUESTS'
      });
    }
  });

export const limiteGeneralApi = construirLimitador({
  ventanaMs: environment.rateLimit.generalWindowMs,
  maximo: environment.rateLimit.generalMax
});

export const limiteAutenticacion = construirLimitador({
  ventanaMs: environment.rateLimit.authWindowMs,
  maximo: environment.rateLimit.authMax
});

export default {
  limiteGeneralApi,
  limiteAutenticacion
};
