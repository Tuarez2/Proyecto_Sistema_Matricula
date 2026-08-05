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
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import type { Asignatura } from '../../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../../asignaturas/services/asignaturas.service';
import type { Docente } from '../../../docentes/models/docente.model';
import { DocentesService } from '../../../docentes/services/docentes.service';
import {
  ESTADOS_PERIODO_ACADEMICO,
  type PeriodoAcademico,
} from '../../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../../periodos-academicos/services/periodos-academicos.service';
import type { SolicitudCrearCurso } from '../../models/curso.model';
import { CursosService } from '../../services/cursos.service';

interface ControlesFormularioCurso {
  periodo_id: FormControl<string>;
  asignatura_id: FormControl<string>;
  docente_id: FormControl<string>;
  paralelo: FormControl<string>;
  aula: FormControl<string>;
  horario: FormControl<string>;
  cupo: FormControl<number | null>;
}

@Component({
  selector: 'app-crear-curso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-curso.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearCursoComponent implements OnInit {
  private readonly servicio = inject(CursosService);
  private readonly periodosServicio = inject(PeriodosAcademicosService);
  private readonly asignaturasServicio = inject(AsignaturasService);
  private readonly docentesServicio = inject(DocentesService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoPeriodos = signal<PeriodoAcademico[]>([]);
  private readonly estadoAsignaturas = signal<Asignatura[]>([]);
  private readonly estadoDocentes = signal<Docente[]>([]);
  private readonly estadoCargandoCatalogos = signal(false);
  private readonly estadoCatalogosPendientes = signal(0);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly periodos = this.estadoPeriodos.asReadonly();
  readonly asignaturas = this.estadoAsignaturas.asReadonly();
  readonly docentes = this.estadoDocentes.asReadonly();
  readonly cargandoCatalogos = this.estadoCargandoCatalogos.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioCurso = new FormGroup<ControlesFormularioCurso>({
    periodo_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    asignatura_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    docente_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paralelo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(10)],
    }),
    aula: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    horario: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    cupo: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  guardarCurso(): void {
    if (this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);

    if (this.formularioCurso.invalid) {
      this.formularioCurso.markAllAsTouched();
      this.estadoMensajeError.set('Revise los datos del curso.');
      return;
    }

    this.estadoEnviando.set(true);
    this.servicio
      .crearCurso(this.construirSolicitud())
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Curso creado correctamente.',
          );
          void this.enrutador.navigateByUrl('/cursos');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    void this.enrutador.navigateByUrl('/cursos');
  }

  obtenerNombreDocente(docente: Docente): string {
    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  private cargarCatalogos(): void {
    if (this.cargandoCatalogos()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoCargandoCatalogos.set(true);
    this.estadoCatalogosPendientes.set(3);
    this.cargarPeriodos();
    this.cargarAsignaturas();
    this.cargarDocentes();
  }

  private cargarPeriodos(): void {
    this.periodosServicio
      .listarPeriodos({ limite: 100 })
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => {
          this.estadoPeriodos.set(
            (respuesta.data ?? []).filter((periodo) =>
              this.permiteGestionarCursos(periodo),
            ),
          );
          this.finalizarCargaCatalogos();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          this.finalizarCargaCatalogos();
        },
      });
  }

  private cargarAsignaturas(): void {
    this.asignaturasServicio
      .listarAsignaturas()
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => {
          this.estadoAsignaturas.set(
            (respuesta.data ?? []).filter((asignatura) => asignatura.activo),
          );
          this.finalizarCargaCatalogos();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          this.finalizarCargaCatalogos();
        },
      });
  }

  private cargarDocentes(): void {
    this.docentesServicio
      .listarDocentes()
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => {
          this.estadoDocentes.set(
            (respuesta.data ?? []).filter((docente) => docente.activo),
          );
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

  private permiteGestionarCursos(periodo: PeriodoAcademico): boolean {
    return (
      periodo.estado === ESTADOS_PERIODO_ACADEMICO.PLANIFICADO ||
      periodo.estado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA ||
      periodo.estado === ESTADOS_PERIODO_ACADEMICO.EN_CURSO
    );
  }

  private construirSolicitud(): SolicitudCrearCurso {
    const valores = this.formularioCurso.getRawValue();

    return {
      periodo_id: Number(valores.periodo_id),
      asignatura_id: Number(valores.asignatura_id),
      docente_id: Number(valores.docente_id),
      paralelo: valores.paralelo.trim(),
      aula: valores.aula.trim(),
      horario: valores.horario.trim(),
      cupo_maximo: Number(valores.cupo),
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible crear el curso.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar cursos.';
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
      return 'Ocurrió un error del servidor al guardar el curso.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible crear el curso.';
  }

  private obtenerMensajeNoEncontrado(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El período académico seleccionado no existe.';
    }

    if (cuerpo?.code === 'ASIGNATURA_NOT_FOUND') {
      return 'La asignatura seleccionada no existe.';
    }

    if (cuerpo?.code === 'DOCENTE_NOT_FOUND') {
      return 'El docente seleccionado no existe.';
    }

    return cuerpo?.message || 'El recurso seleccionado no existe.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos del curso.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'CURSO_DUPLICADO') {
      return 'Ya existe un curso con el mismo período, asignatura y paralelo.';
    }

    if (cuerpo?.code === 'ASIGNATURA_INACTIVA') {
      return 'La asignatura seleccionada está inactiva.';
    }

    if (cuerpo?.code === 'DOCENTE_INACTIVO') {
      return 'El docente seleccionado está inactivo.';
    }

    if (cuerpo?.code === 'PERIODO_ACADEMICO_NO_HABILITADO') {
      return 'El período académico seleccionado no permite gestionar cursos.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos del curso.';
  }
}
