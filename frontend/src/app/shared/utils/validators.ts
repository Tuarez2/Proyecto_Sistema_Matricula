export class ValidatorsUtil {

  static soloNumeros(valor: string): boolean {
    return /^[0-9]+$/.test(valor);
  }

  static validarCedula(valor: string): boolean {
    return valor.length === 10;
  }

}
