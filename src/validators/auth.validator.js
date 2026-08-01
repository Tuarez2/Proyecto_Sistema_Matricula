import { body } from 'express-validator';

import { validateAllowedFields } from './common.validator.js';

export const validateLogin = [
  validateAllowedFields(['correo', 'password']),
  body('correo')
    .exists()
    .withMessage('El correo es obligatorio.')
    .bail()
    .isEmail()
    .withMessage('El correo debe tener un formato valido.')
    .bail()
    .isLength({ max: 150 })
    .withMessage('El correo es demasiado largo.')
    .normalizeEmail(),
  body('password')
    .exists()
    .withMessage('La contrasena es obligatoria.')
    .bail()
    .isString()
    .withMessage('La contrasena debe ser texto.')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('La contrasena tiene una longitud invalida.')
];

export const validateRefresh = [
  validateAllowedFields(['refreshToken']),
  body('refreshToken')
    .exists()
    .withMessage('El refresh token es obligatorio.')
    .bail()
    .isString()
    .withMessage('El refresh token debe ser texto.')
    .bail()
    .isJWT()
    .withMessage('El refresh token tiene un formato invalido.')
];

export default {
  validateLogin,
  validateRefresh
};
