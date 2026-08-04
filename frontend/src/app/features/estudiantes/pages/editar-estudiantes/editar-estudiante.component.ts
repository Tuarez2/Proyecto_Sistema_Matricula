import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EstudiantesService } from '../../services/estudiantes.service';
import { Estudiante } from '../../models/estudiante.model';
import { EstudianteFormComponent } from '../../components/estudiante-form/estudiante-form.component';

@Component({
  selector: 'app-editar-estudiante',
  standalone: true,
  imports: [CommonModule, EstudianteFormComponent],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">✏️ Editar Estudiante</h2>
      <app-estudiante-form 
        *ngIf="estudiante" 
        [initialData]="estudiante" 
        [isEdit]="true" 
        (onSave)="guardar($event)" 
        (onCancel)="cancelar()">
      </app-estudiante-form>
    </div>
  `
})
export class EditarEstudianteComponent implements OnInit {
  estudiante?: Estudiante;
  estudianteId!: number;

  constructor(
    private route: ActivatedRoute,
    private estudiantesService: EstudiantesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.estudianteId) {
      this.estudiantesService.getEstudianteById(this.estudianteId).subscribe(data => {
        this.estudiante = data;
      });
    }
  }

  guardar(estudiante: Estudiante): void {
    this.estudiantesService.actualizarEstudiante(this.estudianteId, estudiante).subscribe(() => {
      this.router.navigate(['/estudiantes']);
    });
  }

  cancelar(): void {
    this.router.navigate(['/estudiantes']);
  }
}