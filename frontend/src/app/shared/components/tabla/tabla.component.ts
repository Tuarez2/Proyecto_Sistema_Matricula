import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnaTabla {
  clave: string;
  titulo: string;
}

@Component({
  selector: 'app-tabla',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-responsive">
      <table class="table table-striped table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th *ngFor="let col of columnas">{{ col.titulo }}</th>
            <th *ngIf="mostrarAcciones" class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of datos">
            <td *ngFor="let col of columnas">{{ item[col.clave] }}</td>
            <td *ngIf="mostrarAcciones" class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" (click)="onEditar(item)">Editar</button>
              <button class="btn btn-sm btn-outline-danger" (click)="onEliminar(item)">Eliminar</button>
            </td>
          </tr>
          <tr *ngIf="datos.length === 0">
            <td [attr.colspan]="columnas.length + (mostrarAcciones ? 1 : 0)" class="text-center py-4 text-muted">
              No hay información disponible para mostrar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
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
