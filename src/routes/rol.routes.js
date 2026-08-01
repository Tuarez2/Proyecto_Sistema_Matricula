import { Router } from 'express';

import { obtenerRoles } from '../controllers/rol.controller.js';
import { ROLE_CODES } from '../constants/domain.constants.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';

const router = Router();

router.get('/', authenticate, authorizeRoles(ROLE_CODES.ADMIN), obtenerRoles);

export default router;
