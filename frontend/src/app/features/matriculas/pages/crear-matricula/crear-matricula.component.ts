import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatriculasService } from '../../services/matriculas.service';
import { EstudiantesService } from '../../../estudiantes/services/estudiantes.service';
import { CursosService } from '../../../cursos/services/cursos.service';
import { Estudiante } from '../../../estudiantes/models/estudiante.model';
import { Curso } from '../../../cursos/models/curso.model';

@Component({
  selector: 'app-crear-matricula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './crear-matricula.component.html'
})
export class CrearMatriculaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly matriculasService = inject(MatriculasService);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly cursosService = inject(CursosService);
  private readonly router = inject(Router);

  form!: FormGroup;
  estudiantes: Estudiante[] = [];
  cursos: Curso[] = [];

  errorMessage: string | null = null;
  conflictos: string[] = [];

  ngOnInit(): void {
    this.initForm();
    this.cargarEstudiantes();
    this.cargarCursos();
  }

  private initForm(): void {
    this.form = this.fb.group({
      estudianteId: ['', Validators.required],
      periodoLectivo: ['2026-1', Validators.required],
      cursosSeleccionados: this.fb.array([], Validators.required)
    });
  }

  private cargarEstudiantes(): void {
    this.estudiantesService.getEstudiantes({ estado: 'ACTIVO' }).subscribe({
      next: (data) => this.estudiantes = data,
      error: (err) => console.error('Error al cargar estudiantes', err)
    });
  }

 private cargarCursos(): void {
  this.cursosService.getCursos({ estado: 'ACTIVO' }).subscribe({
    next: (data: Curso[]) => this.cursos = data,
    error: (error: any) => console.error('Error al cargar cursos', error)
  });
}

  onCheckboxChange(e: any): void {
    const checkArray: FormArray = this.form.get('cursosSeleccionados') as FormArray;
    if (e.target.checked) {
      checkArray.push(this.fb.control(Number(e.target.value)));
    } else {
      let i: number = 0;
      checkArray.controls.forEach((item: any) => {
        if (item.value === Number(e.target.value)) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  guardar(): void {
    this.errorMessage = null;
    this.conflictos = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formVal = this.form.value;
    const payload = {
      estudianteId: Number(formVal.estudianteId),
      periodoLectivo: formVal.periodoLectivo,
      estado: 'REGISTRADA' as const,
      detalles: formVal.cursosSeleccionados.map((id: number) => ({ cursoId: id }))
    };

    this.matriculasService.crearMatricula(payload).subscribe({
      next: () => this.router.navigate(['/matriculas']),
      error: (err) => {
        if (err.error && err.error.mensaje) {
          this.errorMessage = err.error.mensaje;
          this.conflictos = err.error.detallesConflictos || [];
        } else {
          this.errorMessage = 'Ocurrió un error al procesar la matrícula. Verifica que la materia tenga cupo disponible o que el periodo no esté cerrado.';
        }
      }
    });
  }
}
