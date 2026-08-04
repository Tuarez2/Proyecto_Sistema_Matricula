import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Docente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-responsive bg-white shadow-sm rounded">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-dark">
          <tr>
            <th>Cédula</th>
            <th>Docente</th>
            <th>Título</th>
            <th>Especialidad</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let docente of docentes">
            <td class="fw-bold">{{ docente.cedula }}</td>
            <td>{{ docente.apellidos }} {{ docente.nombres }}</td>
            <td><span class="badge bg-light text-dark border">{{ docente.titulo }}</span></td>
            <td>{{ docente.especialidad }}</td>
            <td>
              <small class="d-block text-muted">{{ docente.email }}</small>
              <small class="text-muted">{{ docente.telefono }}</small>
            </td>
            <td>
              <span class="badge" [ngClass]="docente.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'">
                {{ docente.estado }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" (click)="onEdit.emit(docente)">
                ✏️
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="onDelete.emit(docente.id)">
                🗑️
              </button>
            </td>
          </tr>
          <tr *ngIf="docentes.length === 0">
            <td colspan="7" class="text-center py-4 text-muted">
              No se encontraron docentes registrados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class DocenteTableComponent {
  @Input() docentes: Docente[] = [];
  @Output() onEdit = new EventEmitter<Docente>();
  @Output() onDelete = new EventEmitter<number>();
}
