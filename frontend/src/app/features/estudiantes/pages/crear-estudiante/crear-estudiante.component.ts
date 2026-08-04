import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EstudiantesService } from '../../services/estudiantes.service';
import { Estudiante } from '../../models/estudiante.model';
import { EstudianteFormComponent } from '../../components/estudiante-form/estudiante-form.component';

@Component({
  selector: 'app-crear-estudiante',
  standalone: true,
  imports: [CommonModule, EstudianteFormComponent],
  templateUrl: './crear-estudiante.component.html',
  styleUrls: ['./crear-estudiante.component.css']
})
export class CrearEstudianteComponent {
  constructor(
    private estudiantesService: EstudiantesService,
    private router: Router
  ) {}

  guardarEstudiante(estudiante: Estudiante): void {
    this.estudiantesService.crearEstudiante(estudiante).subscribe(() => {
      this.router.navigate(['/estudiantes']);
    });
  }

  cancelar(): void {
    this.router.navigate(['/estudiantes']);
  }
}