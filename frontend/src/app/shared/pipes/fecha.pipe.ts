import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fecha',
  standalone: true,
})
export class FechaPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (valor == null || valor === '') {
      return 'No registrada';
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return 'No registrada';
    }

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
    const anio = fecha.getFullYear();

    return `${dia} ${mes.replace('.', '')} ${anio}`;
  }
}