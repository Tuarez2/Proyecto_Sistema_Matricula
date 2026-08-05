import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { ESTADOS_CURSO, type Curso } from '../../models/curso.model';
import { CursosService } from '../../services/cursos.service';

@Component({
  selector: 'app-ver-curso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ver-curso.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerCursoComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(CursosService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoCurso = signal<Curso | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly curso = this.estadoCurso.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()?.rol?.codigo ===
      CODIGOS_ROL.ADMIN,
  );
  readonly estaCancelado = computed(
    () => this.estadoCurso()?.estado === ESTADOS_CURSO.CANCELADO,
  );

  ngOnInit(): void {
    const idCurso = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idCurso) || idCurso < 1) {
      this.estadoMensajeError.set('El identificador del curso no es válido.');
      return;
    }

    this.cargarCurso(idCurso);
  }

  obtenerNombreAsignatura(): string {
    const curso = this.curso();

    if (!curso?.asignatura) {
      return 'Sin asignatura';
    }

    return `${curso.asignatura.codigo} - ${curso.asignatura.nombre}`;
  }

  obtenerNombreDocente(): string {
    const docente = this.curso()?.docente;

    if (!docente) {
      return 'Sin docente';
    }

    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  obtenerNombrePeriodo(): string {
    const periodo = this.curso()?.periodoAcademico;

    if (!periodo) {
      return 'Sin período';
    }

    return `${periodo.codigo} - ${periodo.nombre}`;
  }

  obtenerEtiquetaEstado(): string {
    const curso = this.curso();

    if (!curso) {
      return '';
    }

    if (curso.estado === ESTADOS_CURSO.ABIERTO) {
      return 'Abierto';
    }

    if (curso.estado === ESTADOS_CURSO.CERRADO) {
      return 'Cerrado';
    }

    if (curso.estado === ESTADOS_CURSO.CANCELADO) {
      return 'Cancelado';
    }

    return curso.estado;
  }

  private cargarCurso(idCurso: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.servicio
      .obtenerCurso(idCurso)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCurso.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el curso.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar cursos.';
    }

    if (error.status === 404) {
      return 'El curso solicitado no existe.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar el curso.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar el curso.';
  }
}
