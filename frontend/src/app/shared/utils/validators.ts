import type { AbstractControl, ValidatorFn } from '@angular/forms';

export const PATRON_IDENTIFICACION = /^(?=.*\d)[A-Za-z0-9-]{5,20}$/;
export const PATRON_TELEFONO = /^(?=.*\d)\+?[0-9\s()-]{7,20}$/;
export const PATRON_NOMBRES = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;
export const EDAD_MINIMA_ESTUDIANTE = 15;

export const calcularEdad = (fechaNacimiento: string): number | null => {
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

const valorTexto = (control: AbstractControl): string => String(control.value ?? '').trim();

export function validarIdentificacion(): ValidatorFn {
  return (control) => {
    if (valorTexto(control) === '') {
      return null;
    }

    return PATRON_IDENTIFICACION.test(valorTexto(control)) ? null : { identificacionInvalida: true };
  };
}

export function validarNombre(): ValidatorFn {
  return (control) => {
    if (valorTexto(control) === '') {
      return null;
    }

    return PATRON_NOMBRES.test(valorTexto(control)) ? null : { nombreInvalido: true };
  };
}

export function validarTelefono(): ValidatorFn {
  return (control) => {
    if (valorTexto(control) === '') {
      return null;
    }

    return PATRON_TELEFONO.test(valorTexto(control)) ? null : { telefonoInvalido: true };
  };
}

export function validarFechaNacimiento(edadMinima = EDAD_MINIMA_ESTUDIANTE): ValidatorFn {
  return (control) => {
    const valor = control.value;

    if (!valor) {
      return null;
    }

    const edad = calcularEdad(valor);

    if (edad === null) {
      return { fechaNacimientoInvalida: true };
    }

    if (edad < 0) {
      return { fechaFutura: true };
    }

    if (edad < edadMinima) {
      return { edadMinima: { edadMinima } };
    }

    return null;
  };
}

export class ValidatorsUtil {

  static soloNumeros(valor: string): boolean {
    return /^[0-9]+$/.test(valor);
  }

  static validarCedula(valor: string): boolean {
    return valor.length === 10;
  }

}
