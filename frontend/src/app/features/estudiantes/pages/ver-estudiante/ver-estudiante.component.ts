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
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import {
  ESTADOS_MATRICULA,
  type EstadoMatricula,
  type Matricula,
} from '../../../matriculas/models/matricula.model';
import { MatriculasService } from '../../../matriculas/services/matriculas.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type EstadoAcademicoEstudiante,
  type Estudiante,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';

interface GrupoMatriculas {
  id: number;
  nombre: string;
  matriculas: Matricula[];
}

const PESTANIA_DATOS = 'datos';
const PESTANIA_HISTORIAL = 'historial';

@Component({
  selector: 'app-ver-estudiante',
  standalone: true,
  imports: [CommonModule, RouterLink, FechaPipe],
  templateUrl: './ver-estudiante.component.html',
  styleUrl: './ver-estudiante.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerEstudianteComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly matriculasService = inject(MatriculasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoEstudiante = signal<Estudiante | null>(null);
  private readonly estadoMatriculas = signal<Matricula[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoCargandoHistorial = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoPestaniaActiva = signal<string>(PESTANIA_DATOS);

  readonly estudiante = this.estadoEstudiante.asReadonly();
  readonly matriculas = this.estadoMatriculas.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly cargandoHistorial = this.estadoCargandoHistorial.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly pestaniaActiva = this.estadoPestaniaActiva.asReadonly();
  readonly puedeGestionarMatriculas = computed(() => {
    const codigoRol = this.autenticacionService.usuarioActual()?.rol?.codigo;

    return (
      codigoRol === CODIGOS_ROL.ADMIN ||
      codigoRol === CODIGOS_ROL.GESTOR_MATRICULA
    );
  });
  readonly gruposHistorial = computed(() =>
    this.agruparPorPeriodo(this.estadoMatriculas()),
  );

  ngOnInit(): void {
    const idEstudiante = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idEstudiante) || idEstudiante < 1) {
      this.estadoMensajeError.set('El identificador del estudiante no es válido.');
      return;
    }

    this.cargarEstudiante(idEstudiante);
  }

  cargarEstudiante(idEstudiante: number): void {
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
          this.estadoMensajeError.set(this.obtenerMensajeErrorEstudiante(error));
        },
      });
  }

  mostrarPestania(pestania: string): void {
    this.estadoPestaniaActiva.set(pestania);
  }

  obtenerEtiquetaEstadoAcademico(estado: EstadoAcademicoEstudiante): string {
    const etiquetas: Record<EstadoAcademicoEstudiante, string> = {
      [ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO]: 'Activo',
      [ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO]: 'Inactivo',
      [ESTADOS_ACADEMICOS_ESTUDIANTE.SUSPENDIDO]: 'Suspendido',
      [ESTADOS_ACADEMICOS_ESTUDIANTE.EGRESADO]: 'Egresado',
    };

    return etiquetas[estado];
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

  private cargarHistorial(idEstudiante: number): void {
    this.estadoCargandoHistorial.set(true);
    this.matriculasService.listarMatriculas({
      estudiante_id: idEstudiante,
      limit: 100,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoHistorial.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMatriculas.set(respuesta.data ?? []);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeErrorHistorial(error));
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

  private obtenerMensajeErrorEstudiante(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el estudiante.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar estudiantes.';
    }

    if (error.status === 404) {
      return 'El estudiante solicitado no existe.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar el estudiante.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar el estudiante.';
  }

  private obtenerMensajeErrorHistorial(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el historial de matrículas.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar el historial.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar el historial de matrículas.';
  }
}
