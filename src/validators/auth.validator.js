import { body } from 'express-validator';

import { validarCamposPermitidos } from './common.validator.js';

export const validarLogin = [
  validarCamposPermitidos(['correo', 'password']),
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

export const validarRefresh = [
  validarCamposPermitidos(['refreshToken']),
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
  validarLogin,
  validarRefresh
};
