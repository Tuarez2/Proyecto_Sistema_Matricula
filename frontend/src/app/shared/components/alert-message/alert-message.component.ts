import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

const CLASES_POR_TIPO = {
  danger: 'alert--error',
  warning: 'alert--warning',
  info: 'alert--info',
  success: 'alert--success',
} as const;

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert-message.component.html',
  styleUrl: './alert-message.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  @Input() tipo: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  @Input() titulo = 'Error';
  @Input() mensaje: string | null = null;
  @Input() detalles: string[] = [];
  @Input() descartable = false;

  @Output() descartada = new EventEmitter<void>();

  get clasePorTipo(): string {
    return CLASES_POR_TIPO[this.tipo];
  }

  descartar(): void {
    this.mensaje = null;
    this.descartada.emit();
  }
}
