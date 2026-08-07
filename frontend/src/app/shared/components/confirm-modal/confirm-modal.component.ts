import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css',
})
export class ConfirmModalComponent implements OnChanges, AfterViewInit {
  @Input() oAbierto = false;
  @Input() titulo = 'Confirmar acción';
  @Input() mensaje = '¿Está seguro de continuar?';
  @Input() peligroso = false;
  @Input() procesando = false;
  @Input() etiquetaConfirmar = 'Confirmar';
  @Input() etiquetaCancelar = 'Cancelar';

  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  @ViewChild('contenedor') private readonly contenedor?: ElementRef<HTMLElement>;

  private elementoAnterior: HTMLElement | null = null;
  private confirmacionBloqueada = false;

  ngOnChanges(cambios: SimpleChanges): void {
    const apertura = cambios['oAbierto'];
    const procesando = cambios['procesando'];

    if (apertura && apertura.currentValue && !apertura.previousValue) {
      this.alAbrir();
    } else if (apertura && !apertura.currentValue && apertura.previousValue) {
      this.alCerrar();
    }

    if (procesando && procesando.previousValue && !procesando.currentValue) {
      this.confirmacionBloqueada = false;
    }
  }

  ngAfterViewInit(): void {
    if (this.oAbierto) {
      this.fijarFocoInicial();
    }
  }

  onConfirmar(): void {
    if (this.procesando || this.confirmacionBloqueada) {
      return;
    }

    this.confirmacionBloqueada = true;
    this.confirmado.emit();
  }

  onCancelar(): void {
    if (this.procesando) {
      return;
    }

    this.cancelado.emit();
  }

  onFondoClic(): void {
    this.onCancelar();
  }

  @HostListener('document:keydown', ['$event'])
  manejarTecla(evento: KeyboardEvent): void {
    if (!this.oAbierto) {
      return;
    }

    if (evento.key === 'Escape') {
      if (this.procesando) {
        return;
      }

      evento.preventDefault();
      this.onCancelar();
      return;
    }

    if (evento.key === 'Tab') {
      this.atraparFoco(evento);
    }
  }

  private alAbrir(): void {
    this.confirmacionBloqueada = false;
    this.elementoAnterior = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => this.fijarFocoInicial());
  }

  private alCerrar(): void {
    this.restaurarFoco();
  }

  private fijarFocoInicial(): void {
    const contenedor = this.contenedor?.nativeElement;

    if (!contenedor) {
      return;
    }

    const enfoqueInicial =
      contenedor.querySelector<HTMLElement>('button') ?? contenedor;
    enfoqueInicial.focus();
  }

  private restaurarFoco(): void {
    if (this.elementoAnterior && this.elementoAnterior.isConnected) {
      this.elementoAnterior.focus();
    }

    this.elementoAnterior = null;
  }

  private atraparFoco(evento: KeyboardEvent): void {
    const contenedor = this.contenedor?.nativeElement;

    if (
      !contenedor ||
      !contenedor.contains(document.activeElement)
    ) {
      return;
    }

    const elementosFocalizables = Array.from(
      contenedor.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((elemento) => !(elemento as HTMLButtonElement).disabled);

    if (elementosFocalizables.length === 0) {
      return;
    }

    const primero = elementosFocalizables[0];
    const ultimo = elementosFocalizables[elementosFocalizables.length - 1];
    const activo = document.activeElement as HTMLElement;

    if (evento.shiftKey && activo === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }
}