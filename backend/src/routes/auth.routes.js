import { Router } from 'express';

import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import authenticate from '../middlewares/authenticate.js';
import validarSolicitud from '../middlewares/validateRequest.js';
import { validarLogin, validarRefresh } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', validarLogin, validarSolicitud, login);
router.post('/refresh', validarRefresh, validarSolicitud, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
