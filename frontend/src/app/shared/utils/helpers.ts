export class Helpers {

  static formatearNombre(nombre: string): string {
    return nombre.trim().toUpperCase();
  }

  static capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

}
