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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../core/models/respuesta-api.model';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';
import {
  ESTADOS_MATRICULA,
  type EstadoMatricula,
  type Matricula,
  type ResumenMatriculas,
} from '../matriculas/models/matricula.model';
import { MatriculasService } from '../matriculas/services/matriculas.service';

@Component({
  selector: 'app-dashboard-gestor',
  standalone: true,
  imports: [CommonModule, RouterLink, FechaPipe],
  templateUrl: './dashboard-gestor.component.html',
  styleUrl: './dashboard-gestor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardGestorComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoResumen = signal<ResumenMatriculas | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly resumen = this.estadoResumen.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    if (this.cargando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoCargando.set(true);
    this.matriculasService.obtenerResumenMatriculas()
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoResumen.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
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

  diasRestantesDeMatricula(resumen: ResumenMatriculas): number | null {
    if (!resumen.ventana_matricula_abierta || !resumen.periodo_actual?.fecha_fin_matricula) {
      return null;
    }

    const fin = new Date(resumen.periodo_actual.fecha_fin_matricula);
    const hoy = new Date();

    if (Number.isNaN(fin.getTime())) {
      return null;
    }

    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    return Math.max(
      0,
      Math.round((fin.getTime() - hoy.getTime()) / milisegundosPorDia),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el resumen de matrículas.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar el resumen.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar el resumen.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar el resumen de matrículas.';
  }
}
