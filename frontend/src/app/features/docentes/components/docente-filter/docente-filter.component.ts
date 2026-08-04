import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltrosDocente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-5">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Buscar por cédula, nombres o apellidos..."
              [(ngModel)]="filtros.busqueda"
              (keyup.enter)="aplicarFiltros()">
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="filtros.estado">
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-primary flex-grow-1" (click)="aplicarFiltros()">
              🔍 Buscar
            </button>
            <button class="btn btn-outline-secondary" (click)="limpiarFiltros()">
              🧹 Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocenteFilterComponent {
  @Output() onFilter = new EventEmitter<FiltrosDocente>();

  filtros: FiltrosDocente = {
    busqueda: '',
    estado: ''
  };

  aplicarFiltros(): void {
    this.onFilter.emit({ ...this.filtros });
  }

  limpiarFiltros(): void {
    this.filtros = { busqueda: '', estado: '' };
    this.onFilter.emit({ ...this.filtros });
  }
}
