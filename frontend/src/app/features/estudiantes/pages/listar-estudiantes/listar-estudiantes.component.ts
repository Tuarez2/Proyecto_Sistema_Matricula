import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EstudiantesService } from '../../services/estudiantes.service';
import { Estudiante, FiltrosEstudiante } from '../../models/estudiante.model';
import { EstudianteFilterComponent } from '../../components/estudiante-filter/estudiante-filter.component';
import { EstudianteTableComponent } from '../../components/estudiante-table/estudiante-table.component';

@Component({
  selector: 'app-listar-estudiantes',
  standalone: true,
  imports: [CommonModule, EstudianteFilterComponent, EstudianteTableComponent],
  templateUrl: './listar-estudiantes.component.html',
  styleUrls: ['./listar-estudiantes.component.css']
})
export class ListarEstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];

  constructor(
    private estudiantesService: EstudiantesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(filtros?: FiltrosEstudiante): void {
    this.estudiantesService.getEstudiantes(filtros).subscribe(data => {
      this.estudiantes = data;
    });
  }

  navegarACrear(): void {
    this.router.navigate(['/estudiantes/crear']);
  }

  navegarAEditar(id: number): void {
    this.router.navigate(['/estudiantes/editar', id]);
  }

  eliminarEstudiante(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este estudiante?')) {
      this.estudiantesService.eliminarEstudiante(id).subscribe(() => {
        this.cargarEstudiantes();
      });
    }
  }
}
