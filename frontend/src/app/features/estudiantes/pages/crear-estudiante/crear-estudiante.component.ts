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
  template: `
    <div class="container py-4">
      <h2 class="mb-4">🎓 Registrar Nuevo Estudiante</h2>
      <app-estudiante-form (onSave)="guardar($event)" (onCancel)="cancelar()"></app-estudiante-form>
    </div>
  `
})
export class CrearEstudianteComponent {
  constructor(private estudiantesService: EstudiantesService, private router: Router) {}

  guardar(estudiante: Estudiante): void {
    this.estudiantesService.crearEstudiante(estudiante).subscribe(() => {
      this.router.navigate(['/estudiantes']);
    });
  }

  cancelar(): void {
    this.router.navigate(['/estudiantes']);
  }
}