import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export interface AccionContextual {
  id: string;
  etiqueta: string;
  variante?: 'primary' | 'neutral' | 'danger';
}

export function esElementoInteractivo(objetivo: EventTarget | null): boolean {
  if (!(objetivo instanceof HTMLElement)) {
    return true;
  }

  return (
    objetivo.closest('a, button, input, select, textarea, label') !== null
  );
}

@Component({
  selector: 'app-barra-acciones-contextuales',
  imports: [],
  templateUrl: './barra-acciones-contextuales.component.html',
  styleUrl: './barra-acciones-contextuales.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraAccionesContextualesComponent {
  @Input() acciones: AccionContextual[] = [];
  @Input() haySeleccion = false;

  @Output() ejecutar = new EventEmitter<string>();

  claseVariante(accion: AccionContextual): string {
    switch (accion.variante) {
      case 'danger':
        return 'btn-danger';
      case 'primary':
        return 'btn-primary';
      default:
        return 'btn-neutral';
    }
  }
}
