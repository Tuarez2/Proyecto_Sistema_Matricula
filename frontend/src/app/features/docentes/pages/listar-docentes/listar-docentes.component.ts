import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocentesService } from '../../services/docentes.service';
import { Docente, FiltrosDocente } from '../../models/docente.model';
import { DocenteTableComponent } from '../../components/docente-table/docente-table.component';
import { DocenteFilterComponent } from '../../components/docente-filter/docente-filter.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-listar-docentes',
  standalone: true,
  imports: [
    CommonModule,
    DocenteTableComponent,
    DocenteFilterComponent,
    LoadingSpinnerComponent,
    PaginationComponent
  ],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👨‍🏫 Gestión de Docentes</h2>
          <p class="text-muted mb-0">Administración de nómina y especialidades de docentes</p>
        </div>
        <button class="btn btn-success" (click)="nuevoDocente()">
          ➕ Nuevo Docente
        </button>
      </div>

      <app-docente-filter (onFilter)="filtrar($event)"></app-docente-filter>

      <app-loading-spinner [isLoading]="loading"></app-loading-spinner>

      <div *ngIf="!loading">
        <app-docente-table 
          [docentes]="docentes" 
          (onEdit)="editarDocente($event)" 
          (onDelete)="eliminarDocente($event)">
        </app-docente-table>

        <app-pagination 
          [currentPage]="1" 
          [totalPages]="1">
        </app-pagination>
      </div>
    </div>
  `
})
export class ListarDocentesComponent implements OnInit {
  docentes: Docente[] = [];
  loading: boolean = true;

  constructor(
    private docentesService: DocentesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDocentes();
  }

  cargarDocentes(filtros?: FiltrosDocente): void {
    this.loading = true;
    this.docentesService.getDocentes(filtros).subscribe({
      next: (data) => {
        this.docentes = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  filtrar(filtros: FiltrosDocente): void {
    this.cargarDocentes(filtros);
  }

  nuevoDocente(): void {
    this.router.navigate(['/docentes/crear']);
  }

  editarDocente(docente: Docente): void {
    this.router.navigate(['/docentes/editar', docente.id]);
  }

  eliminarDocente(id: number): void {
    if (confirm('¿Está seguro de eliminar este docente?')) {
      this.docentesService.eliminarDocente(id).subscribe(() => {
        this.cargarDocentes();
      });
    }
  }
}