import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import {
  ESTADOS_MATRICULA,
  type EstadoMatricula,
  type Matricula,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';

@Component({
  selector: 'app-ver-matricula',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ver-matricula.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerMatriculaComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly matriculasService = inject(MatriculasService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoMatricula = signal<Matricula | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly matricula = this.estadoMatricula.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();

  ngOnInit(): void {
    const idMatricula = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idMatricula) || idMatricula < 1) {
      this.estadoMensajeError.set('El identificador de la matrícula no es válido.');
      return;
    }

    this.cargarMatricula(idMatricula);
  }

  obtenerNombreEstudiante(matricula: Matricula): string {
    const estudiante = matricula.estudiante;

    if (!estudiante) {
      return `Estudiante ${matricula.estudiante_id}`;
    }

    return `${estudiante.nombres} ${estudiante.apellidos}`.trim();
  }

  obtenerDescripcionCurso(matricula: Matricula): string {
    const curso = matricula.curso;
    const asignatura = curso?.asignatura;

    if (!curso) {
      return `Curso ${matricula.curso_id}`;
    }

    if (!asignatura) {
      return `Curso ${curso.id} - Paralelo ${curso.paralelo}`;
    }

    return `${asignatura.codigo} - ${asignatura.nombre} (${curso.paralelo})`;
  }

  obtenerPeriodo(matricula: Matricula): string {
    return matricula.curso?.periodoAcademico?.nombre ?? 'Sin periodo';
  }

  obtenerDocente(matricula: Matricula): string {
    const docente = matricula.curso?.docente;

    if (!docente) {
      return 'Sin docente';
    }

    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  obtenerEtiquetaEstado(estado: EstadoMatricula): string {
    const etiquetas: Record<EstadoMatricula, string> = {
      [ESTADOS_MATRICULA.inscrita]: 'Inscrita',
      [ESTADOS_MATRICULA.aprobada]: 'Aprobada',
      [ESTADOS_MATRICULA.reprobada]: 'Reprobada',
      [ESTADOS_MATRICULA.retirada]: 'Retirada',
      [ESTADOS_MATRICULA.anulada]: 'Anulada',
    };

    return etiquetas[estado];
  }

  private cargarMatricula(idMatricula: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.matriculasService.obtenerMatricula(idMatricula)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMatricula.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar la matrícula.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar matrículas.';
    }

    if (error.status === 404) {
      return 'La matrícula solicitada no existe.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar la matrícula.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar la matrícula.';
  }
}
