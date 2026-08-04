import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstudiantesService } from '../../services/estudiantes.service';
import { Estudiante } from '../../models/estudiante.model';

@Component({
  selector: 'app-listar-estudiantes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>🎓 Lista de Estudiantes</h2>
        <a routerLink="crear" class="btn btn-primary">
          ➕ Nuevo Estudiante
        </a>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Cédula</th>
                  <th>Nombres y Apellidos</th>
                  <th>Correo</th>
                  <th>Carrera</th>
                  <th>Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let e of estudiantes">
                  <td>{{ e.cedula }}</td>
                  <td>{{ e.nombres }} {{ e.apellidos }}</td>
                  <td>{{ e.email }}</td>
                  <td>{{ e.carrera }}</td>
                  <td>
                    <span class="badge" [ngClass]="e.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'">
                      {{ e.estado }}
                    </span>
                  </td>
                  <td class="text-end">
                    <a [routerLink]="['editar', e.id]" class="btn btn-sm btn-outline-warning me-2">
                      ✏️ Editar
                    </a>
                  </td>
                </tr>
                <tr *ngIf="estudiantes.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">No hay estudiantes registrados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ListarEstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];

  constructor(private estudiantesService: EstudiantesService) {}

  ngOnInit(): void {
    this.estudiantesService.getEstudiantes().subscribe(data => {
      this.estudiantes = data;
    });
  }
}
