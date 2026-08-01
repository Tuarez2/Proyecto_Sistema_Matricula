import { Router } from 'express';

import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import authenticate from '../middlewares/authenticate.js';
import validateRequest from '../middlewares/validateRequest.js';
import ApiError from '../utils/ApiError.js';
import { validateLogin, validateRefresh } from '../validators/auth.validator.js';

const router = Router();

const buckets = new Map();

const rateLimit = ({ limit, windowMs }) => (req, res, next) => {
  const now = Date.now();
  const key = `${req.ip}:${req.path}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (bucket.count >= limit) {
    return next(new ApiError(429, 'Demasiados intentos. Intente nuevamente mas tarde.', 'TOO_MANY_REQUESTS'));
  }

  bucket.count += 1;
  return next();
};

const loginLimiter = rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 });
const refreshLimiter = rateLimit({ limit: 20, windowMs: 15 * 60 * 1000 });

router.post('/login', loginLimiter, validateLogin, validateRequest, login);
router.post('/refresh', refreshLimiter, validateRefresh, validateRequest, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
