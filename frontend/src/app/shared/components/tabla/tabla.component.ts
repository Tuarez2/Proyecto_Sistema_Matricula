import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ColumnaTabla {
  clave: string;
  titulo: string;
}

@Component({
  selector: 'app-tabla',
  imports: [],
  templateUrl: './tabla.component.html',
  styleUrl: './tabla.component.css',
})
export class TablaComponent {
  @Input() columnas: ColumnaTabla[] = [];
  @Input() datos: any[] = [];
  @Input() mostrarAcciones = true;

  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<any>();

  onEditar(item: any): void {
    this.editar.emit(item);
  }

  onEliminar(item: any): void {
    this.eliminar.emit(item);
  }
}
