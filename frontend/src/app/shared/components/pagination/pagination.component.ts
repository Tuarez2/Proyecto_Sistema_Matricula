import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input('currentPage') paginaActual = 1;
  @Input('totalPages') totalPaginas = 1;
  @Input() totalRegistros: number | null = null;
  @Input() deshabilitado = false;

  @Output('pageChange') cambioPagina = new EventEmitter<number>();

  get puedeRetroceder(): boolean {
    return !this.deshabilitado && this.paginaNormalizada > 1;
  }

  get puedeAvanzar(): boolean {
    return !this.deshabilitado && this.paginaNormalizada < this.totalPaginasNormalizado;
  }

  get paginaNormalizada(): number {
    return this.normalizarEnteroPositivo(this.paginaActual, 1);
  }

  get totalPaginasNormalizado(): number {
    return this.normalizarEnteroPositivo(this.totalPaginas, 1);
  }

  irAPagina(pagina: number): void {
    const paginaDestino = Math.min(
      Math.max(this.normalizarEnteroPositivo(pagina, this.paginaNormalizada), 1),
      this.totalPaginasNormalizado
    );

    if (this.deshabilitado || paginaDestino === this.paginaNormalizada) {
      return;
    }

    this.cambioPagina.emit(paginaDestino);
  }

  irAnterior(): void {
    this.irAPagina(this.paginaNormalizada - 1);
  }

  irSiguiente(): void {
    this.irAPagina(this.paginaNormalizada + 1);
  }

  private normalizarEnteroPositivo(valor: number, predeterminado: number): number {
    if (!Number.isInteger(valor) || valor < 1) {
      return predeterminado;
    }

    return valor;
  }
}
