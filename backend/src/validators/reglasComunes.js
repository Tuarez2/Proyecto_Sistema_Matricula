import { body } from 'express-validator';

import {
  EDAD_MINIMA_ESTUDIANTE,
  IDENTIFICACION_PATTERN,
  NOMBRES_PATTERN,
  TELEFONO_PATTERN
} from '../constants/domain.constants.js';

export const calcularEdad = (fechaNacimiento) => {
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00.000Z`);

  if (Number.isNaN(nacimiento.getTime())) {
    return null;
  }

  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mesActual = hoy.getUTCMonth() - nacimiento.getUTCMonth();

  if (mesActual < 0 || (mesActual === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) {
    edad -= 1;
  }

  return edad;
};

export const reglaTextoOpcional = (campo, etiqueta, { max = 100, patron } = {}) =>
  body(campo)
    .optional()
    .isString()
    .withMessage(`${etiqueta} debe ser texto.`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${etiqueta} no puede estar vacio.`)
    .bail()
    .isLength({ max })
    .withMessage(`${etiqueta} excede la longitud maxima (${max}).`)
    .bail()
    .custom((valor) => {
      if (patron && !patron.test(valor)) {
        throw new Error(`${etiqueta} contiene caracteres no validos.`);
      }

      return true;
    });

export const reglaNombreOpcional = (campo, etiqueta) =>
  reglaTextoOpcional(campo, etiqueta, { max: 100, patron: NOMBRES_PATTERN });

export const reglaIdentificacionOpcional = (campo = 'identificacion') =>
  body(campo)
    .optional()
    .isString()
    .withMessage('La identificacion debe ser texto.')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('La identificacion no puede estar vacia.')
    .bail()
    .matches(IDENTIFICACION_PATTERN)
    .withMessage('La identificacion debe contener solo letras, numeros o guiones y al menos un numero.');

export const reglaTelefonoOpcional = (campo = 'telefono') =>
  body(campo)
    .optional({ nullable: true })
    .isString()
    .withMessage('El telefono debe ser texto.')
    .bail()
    .trim()
    .custom((valor) => {
      if (valor === '') {
        return true;
      }

      return TELEFONO_PATTERN.test(valor);
    })
    .withMessage('El telefono debe tener un formato valido (solo numeros, +, - y espacios).');

export const reglaCorreoOpcional = (campo = 'correo') =>
  body(campo)
    .optional()
    .isString()
    .withMessage('El correo debe ser texto.')
    .bail()
    .trim()
    .isEmail()
    .withMessage('El correo debe tener un formato valido.')
    .bail()
    .isLength({ max: 150 })
    .withMessage('El correo es demasiado largo.')
    .normalizeEmail();

export const reglaFechaNacimientoOpcional = ({
  campo = 'fecha_nacimiento',
  edadMinima = EDAD_MINIMA_ESTUDIANTE,
  etiqueta = 'La fecha de nacimiento'
} = {}) =>
  body(campo)
    .optional()
    .isISO8601({ strict: true })
    .withMessage(`${etiqueta} debe tener un formato de fecha valido.`)
    .bail()
    .custom((fecha) => {
      const edad = calcularEdad(fecha);

      if (edad === null) {
        throw new Error(`${etiqueta} no es una fecha valida.`);
      }

      if (edad < 0) {
        throw new Error(`${etiqueta} no puede ser una fecha futura.`);
      }

      if (edad < edadMinima) {
        throw new Error(`${etiqueta} implica una edad minima de ${edadMinima} anios.`);
      }

      return true;
    });

export default {
  calcularEdad,
  reglaTextoOpcional,
  reglaNombreOpcional,
  reglaIdentificacionOpcional,
  reglaTelefonoOpcional,
  reglaCorreoOpcional,
  reglaFechaNacimientoOpcional
};
