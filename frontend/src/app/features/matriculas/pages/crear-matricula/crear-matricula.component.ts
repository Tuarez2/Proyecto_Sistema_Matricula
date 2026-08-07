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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { ESTADOS_CURSO, type Curso } from '../../../cursos/models/curso.model';
import { CursosService } from '../../../cursos/services/cursos.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
} from '../../../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../../../estudiantes/services/estudiantes.service';
import type { SolicitudCrearMatricula } from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';

interface ControlesFormularioMatricula {
  estudiante_id: FormControl<string>;
  curso_id: FormControl<string>;
}

@Component({
  selector: 'app-crear-matricula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './crear-matricula.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearMatriculaComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly cursosService = inject(CursosService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoEstudiantes = signal<Estudiante[]>([]);
  private readonly estadoCursos = signal<Curso[]>([]);
  private readonly estadoCargandoCatalogos = signal(false);
  private readonly estadoCatalogosPendientes = signal(0);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly estudiantes = this.estadoEstudiantes.asReadonly();
  readonly cursos = this.estadoCursos.asReadonly();
  readonly cargandoCatalogos = this.estadoCargandoCatalogos.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioMatricula = new FormGroup<ControlesFormularioMatricula>({
    estudiante_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    curso_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    if (this.cargandoCatalogos()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoCargandoCatalogos.set(true);
    this.estadoCatalogosPendientes.set(2);
    this.cargarEstudiantes();
    this.cargarCursos();
  }

  guardar(): void {
    if (this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);

    if (this.formularioMatricula.invalid) {
      this.formularioMatricula.markAllAsTouched();
      this.estadoMensajeError.set('Seleccione un estudiante y un curso válidos.');
      return;
    }

    this.estadoEnviando.set(true);
    this.matriculasService.crearMatricula(this.construirSolicitud())
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Matrícula creada correctamente.',
          );
          void this.enrutador.navigateByUrl('/matriculas');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    void this.enrutador.navigateByUrl('/matriculas');
  }

  obtenerNombreEstudiante(estudiante: Estudiante): string {
    return `${estudiante.numero_matricula} - ${estudiante.nombres} ${estudiante.apellidos}`.trim();
  }

  obtenerDescripcionCurso(curso: Curso): string {
    const asignatura = curso.asignatura;
    const periodo = curso.periodoAcademico;
    const nombreAsignatura = asignatura
      ? `${asignatura.codigo} - ${asignatura.nombre}`
      : `Curso ${curso.id}`;
    const nombrePeriodo = periodo ? ` / ${periodo.nombre}` : '';

    return `${nombreAsignatura} (${curso.paralelo})${nombrePeriodo}`;
  }

  private cargarEstudiantes(): void {
    this.estudiantesService.listarEstudiantes({
      estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
      limite: 100,
    })
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe({
        next: (respuesta) => {
          this.estadoEstudiantes.set(respuesta.data ?? []);
          this.finalizarCargaCatalogos();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          this.finalizarCargaCatalogos();
        },
      });
  }

  private cargarCursos(): void {
    this.cursosService.listar({
      estado: ESTADOS_CURSO.ABIERTO,
      limite: 100,
    })
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe({
        next: (respuesta) => {
          this.estadoCursos.set(respuesta.data ?? []);
          this.finalizarCargaCatalogos();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          this.finalizarCargaCatalogos();
        },
      });
  }

  private finalizarCargaCatalogos(): void {
    this.estadoCatalogosPendientes.update((pendientes) =>
      Math.max(pendientes - 1, 0),
    );

    if (this.estadoCatalogosPendientes() === 0) {
      this.estadoCargandoCatalogos.set(false);
    }
  }

  private construirSolicitud(): SolicitudCrearMatricula {
    const valores = this.formularioMatricula.getRawValue();

    return {
      estudiante_id: Number(valores.estudiante_id),
      curso_id: Number(valores.curso_id),
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar la matrícula.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar matrículas.';
    }

    if (error.status === 404) {
      return this.obtenerMensajeNoEncontrado(error);
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al guardar la matrícula.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar la matrícula.';
  }

  private obtenerMensajeNoEncontrado(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'ESTUDIANTE_NOT_FOUND') {
      return 'El estudiante seleccionado no existe.';
    }

    if (cuerpo?.code === 'CURSO_NOT_FOUND') {
      return 'El curso seleccionado no existe.';
    }

    return cuerpo?.message || 'El recurso solicitado no existe.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos de la matrícula.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'MATRICULA_DUPLICADA') {
      return 'El estudiante ya tiene una matrícula registrada para este curso.';
    }

    if (cuerpo?.code === 'ESTUDIANTE_NO_HABILITADO') {
      return 'El estado académico del estudiante no permite matrícula.';
    }

    if (cuerpo?.code === 'ESTUDIANTE_SIN_CARRERA') {
      return 'El estudiante no tiene una carrera activa asociada.';
    }

    if (cuerpo?.code === 'CARRERA_INACTIVA') {
      return 'La carrera del estudiante no está activa.';
    }

    if (cuerpo?.code === 'CURSO_NO_DISPONIBLE') {
      return 'El curso no está disponible para matrículas.';
    }

    if (cuerpo?.code === 'CURSO_SIN_CUPOS') {
      return 'El curso no tiene cupos disponibles.';
    }

    if (cuerpo?.code === 'PERIODO_NO_PERMITE_MATRICULA') {
      return 'El periodo académico no permite registrar matrículas.';
    }

    if (cuerpo?.code === 'PERIODO_FUERA_DE_VENTANA_MATRICULA') {
      return 'La fecha actual está fuera de la ventana de matrícula.';
    }

    if (cuerpo?.code === 'ASIGNATURA_FUERA_DE_MALLA') {
      return 'La asignatura no pertenece a la malla curricular del estudiante.';
    }

    return cuerpo?.message || 'No fue posible completar la matrícula.';
  }
}
