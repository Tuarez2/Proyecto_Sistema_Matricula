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
  templateUrl: './editar-estudiante.component.html',
  styleUrls: ['./editar-estudiante.component.css']
})
export class EditarEstudianteComponent implements OnInit {
  estudiante?: Estudiante;
  estudianteId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estudiantesService: EstudiantesService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.estudianteId = Number(idParam);
      this.estudiantesService.getEstudianteById(this.estudianteId).subscribe(data => {
        this.estudiante = data;
      });
    }
  }

  actualizarEstudiante(estudiante: Estudiante): void {
    this.estudiantesService.actualizarEstudiante(this.estudianteId, estudiante).subscribe(() => {
      this.router.navigate(['/estudiantes']);
    });
  }

  cancelar(): void {
    this.router.navigate(['/estudiantes']);
  }
}