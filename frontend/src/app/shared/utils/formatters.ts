export class Formatters {
  /**
   * Formatea una fecha string/Date al formato DD/MM/YYYY
   */
  static formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-EC');
  }

  /**
   * Limpia y formatea nombres completos
   */
  static nombreCompleto(nombres?: string, apellidos?: string): string {
    return `${nombres || ''} ${apellidos || ''}`.trim() || 'Sin Nombre';
  }
}