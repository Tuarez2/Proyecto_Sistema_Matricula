import { FormControl } from '@angular/forms';

import {
  calcularEdad,
  validarFechaNacimiento,
  validarIdentificacion,
  validarNombre,
  validarTelefono,
} from './validators';

const evaluar = (validador: (control: FormControl) => unknown, valor: unknown): boolean =>
  validador(new FormControl(valor)) === null;

describe('Validadores comunes de formularios', () => {
  describe('calcularEdad', () => {
    it('calcula la edad correcta para una fecha valida', () => {
      expect(calcularEdad('2000-01-01')).toBeGreaterThanOrEqual(15);
    });

    it('devuelve null para una fecha invalida', () => {
      expect(calcularEdad('no-es-fecha')).toBeNull();
    });
  });

  describe('validarIdentificacion', () => {
    it('acepta una identificacion alfanumerica con al menos un numero', () => {
      expect(evaluar(validarIdentificacion(), '1710000001')).toBe(true);
      expect(evaluar(validarIdentificacion(), 'A123456')).toBe(true);
    });

    it('rechaza una identificacion compuesta solo por letras', () => {
      expect(evaluar(validarIdentificacion(), 'mnbvcxsdfghjkmnbvc')).toBe(false);
    });

    it('rechaza caracteres especiales', () => {
      expect(evaluar(validarIdentificacion(), '171@456789')).toBe(false);
    });

    it('considera valido un valor vacio (la obligatoriedad se valida aparte)', () => {
      expect(evaluar(validarIdentificacion(), '')).toBe(true);
    });
  });

  describe('validarNombre', () => {
    it('acepta letras, acentos y espacios', () => {
      expect(evaluar(validarNombre(), 'María Fernanda')).toBe(true);
    });

    it('rechaza nombres con numeros', () => {
      expect(evaluar(validarNombre(), 'Ana 123')).toBe(false);
    });

    it('considera valido un valor vacio', () => {
      expect(evaluar(validarNombre(), '')).toBe(true);
    });
  });

  describe('validarTelefono', () => {
    it('acepta un telefono con digitos', () => {
      expect(evaluar(validarTelefono(), '0999000001')).toBe(true);
    });

    it('acepta un telefono con prefijo internacional', () => {
      expect(evaluar(validarTelefono(), '+593 99 900 0001')).toBe(true);
    });

    it('rechaza un telefono compuesto por letras', () => {
      expect(evaluar(validarTelefono(), 'dfghjkjhgfds')).toBe(false);
    });

    it('considera valido un valor vacio', () => {
      expect(evaluar(validarTelefono(), '')).toBe(true);
    });
  });

  describe('validarFechaNacimiento', () => {
    it('acepta una fecha de nacimiento valida', () => {
      expect(evaluar(validarFechaNacimiento(), '2000-01-01')).toBe(true);
    });

    it('rechaza una fecha futura', () => {
      expect(evaluar(validarFechaNacimiento(), '2999-01-01')).toBe(false);
    });

    it('rechaza una fecha con edad menor a la minima', () => {
      expect(evaluar(validarFechaNacimiento(), '2021-01-01')).toBe(false);
    });

    it('considera valido un valor vacio', () => {
      expect(evaluar(validarFechaNacimiento(), '')).toBe(true);
    });
  });
});
