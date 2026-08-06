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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import {
  ESTADOS_MATRICULA,
  type EstadoMatricula,
  type Matricula,
} from '../matriculas/models/matricula.model';
import { MatriculasService } from '../matriculas/services/matriculas.service';
import type { Estudiante } from '../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../estudiantes/services/estudiantes.service';

interface GrupoMatriculas {
  id: number;
  nombre: string;
  matriculas: Matricula[];
}

@Component({
  selector: 'app-portal-estudiante',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portal-estudiante.component.html',
  styleUrl: './portal-estudiante.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalEstudianteComponent implements OnInit {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly matriculasService = inject(MatriculasService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoEstudiante = signal<Estudiante | null>(null);
  private readonly estadoMatriculas = signal<Matricula[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly estudiante = this.estadoEstudiante.asReadonly();
  readonly matriculas = this.estadoMatriculas.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly gruposHistorial = computed(() =>
    this.agruparPorPeriodo(this.estadoMatriculas()),
  );

  ngOnInit(): void {
    const idEstudiante = this.autenticacionService.usuarioActual()?.estudiante_id;

    if (
      idEstudiante === undefined ||
      idEstudiante === null ||
      !Number.isInteger(idEstudiante) ||
      idEstudiante < 1
    ) {
      this.estadoMensajeError.set(
        'Su usuario no está vinculado a un estudiante. Contacte al administrador.',
      );
      return;
    }

    this.cargarPortal(idEstudiante);
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

  private cargarPortal(idEstudiante: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.estudiantesService.obtenerEstudiante(idEstudiante)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoEstudiante.set(respuesta.data ?? null);
          this.cargarHistorial(idEstudiante);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private cargarHistorial(idEstudiante: number): void {
    this.matriculasService.listarMatriculas({
      estudiante_id: idEstudiante,
      limit: 100,
    })
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe({
        next: (respuesta) => {
          this.estadoMatriculas.set(respuesta.data ?? []);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private agruparPorPeriodo(matriculas: Matricula[]): GrupoMatriculas[] {
    const grupos = new Map<number, GrupoMatriculas>();

    for (const matricula of matriculas) {
      const periodo = matricula.curso?.periodoAcademico;

      if (!periodo) {
        continue;
      }

      const grupoExistente = grupos.get(periodo.id);

      if (grupoExistente) {
        grupoExistente.matriculas.push(matricula);
      } else {
        grupos.set(periodo.id, {
          id: periodo.id,
          nombre: periodo.nombre,
          matriculas: [matricula],
        });
      }
    }

    return [...grupos.values()].sort((a, b) => b.id - a.id);
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar su información.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar esta información.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar su información.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar su información.';
  }
}
