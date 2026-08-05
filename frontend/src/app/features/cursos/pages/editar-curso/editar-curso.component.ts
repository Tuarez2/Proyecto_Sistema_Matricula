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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import {
  ESTADOS_CURSO,
  type Curso,
  type ReferenciaDocenteCurso,
  type ReferenciaPeriodoCurso,
} from '../../models/curso.model';
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
  selector: 'app-editar-curso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-curso.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarCursoComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(CursosService);
  private readonly periodosServicio = inject(PeriodosAcademicosService);
  private readonly asignaturasServicio = inject(AsignaturasService);
  private readonly docentesServicio = inject(DocentesService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoCurso = signal<Curso | null>(null);
  private readonly estadoPeriodos = signal<PeriodoAcademico[]>([]);
  private readonly estadoAsignaturas = signal<Asignatura[]>([]);
  private readonly estadoDocentes = signal<Docente[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private idCurso: number | null = null;

  readonly curso = this.estadoCurso.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly periodosEdicion = computed(() => this.construirPeriodosEdicion());
  readonly asignaturasEdicion = computed(() => this.construirAsignaturasEdicion());
  readonly docentesEdicion = computed(() => this.construirDocentesEdicion());
  readonly puedeEditar = computed(() => this.construirPuedeEditar());

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
    const idCurso = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idCurso) || idCurso < 1) {
      this.estadoMensajeError.set('El identificador del curso no es válido.');
      this.formularioCurso.disable();
      return;
    }

    this.idCurso = idCurso;
    this.cargarCatalogos();
    this.cargarCurso(idCurso);
  }

  guardarCurso(): void {
    if (
      this.enviando() ||
      this.cargando() ||
      this.idCurso === null ||
      !this.puedeEditar()
    ) {
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
      .actualizarCurso(this.idCurso, this.construirSolicitud())
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Curso actualizado correctamente.',
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

  obtenerEtiquetaAsignatura(asignatura: Asignatura): string {
    const inactiva = asignatura.activo ? '' : ' (inactiva)';
    return `${asignatura.codigo} - ${asignatura.nombre}${inactiva}`;
  }

  obtenerNombreDocente(docente: Docente): string {
    const inactivo = docente.activo ? '' : ' (inactivo)';
    return `${docente.nombres} ${docente.apellidos}${inactivo}`.trim();
  }

  obtenerEtiquetaPeriodo(periodo: PeriodoAcademico): string {
    const noHabilitado = this.permiteGestionarCursos(periodo.estado)
      ? ''
      : ' (no gestionable)';
    return `${periodo.codigo} - ${periodo.nombre}${noHabilitado}`;
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
          if (!respuesta.data) {
            this.estadoMensajeError.set('El curso solicitado no existe.');
            this.formularioCurso.disable();
            return;
          }

          this.estadoCurso.set(respuesta.data);
          this.formularioCurso.setValue({
            periodo_id: String(respuesta.data.periodo_id),
            asignatura_id: String(respuesta.data.asignatura_id),
            docente_id: String(respuesta.data.docente_id),
            paralelo: respuesta.data.paralelo,
            aula: respuesta.data.aula,
            horario: respuesta.data.horario,
            cupo: respuesta.data.cupo_maximo,
          });

          if (!this.puedeEditar()) {
            this.formularioCurso.disable();
          }
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          this.formularioCurso.disable();
        },
      });
  }

  private cargarCatalogos(): void {
    this.periodosServicio
      .listarPeriodos({ limite: 100 })
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => this.estadoPeriodos.set(respuesta.data ?? []),
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });

    this.asignaturasServicio
      .listarAsignaturas({ activo: true, limite: 100 })
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => this.estadoAsignaturas.set(respuesta.data ?? []),
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });

    this.docentesServicio
      .listarDocentes()
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => this.estadoDocentes.set(respuesta.data ?? []),
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private construirPeriodosEdicion(): PeriodoAcademico[] {
    const cursoActual = this.curso();
    const habilitados = this.estadoPeriodos().filter((periodo) =>
      this.permiteGestionarCursos(periodo.estado),
    );

    if (!cursoActual?.periodoAcademico) {
      return habilitados;
    }

    const yaIncluido = habilitados.some(
      (periodo) => periodo.id === cursoActual.periodoAcademico?.id,
    );

    if (yaIncluido) {
      return habilitados;
    }

    const periodoActual = this.estadoPeriodos().find(
      (periodo) => periodo.id === cursoActual.periodoAcademico?.id,
    );

    return periodoActual
      ? [...habilitados, periodoActual]
      : [...habilitados, this.convertirPeriodoReferencia(cursoActual.periodoAcademico)];
  }

  private construirAsignaturasEdicion(): Asignatura[] {
    const cursoActual = this.curso();
    const activas = this.estadoAsignaturas().filter(
      (asignatura) => asignatura.activo,
    );

    if (!cursoActual?.asignatura) {
      return activas;
    }

    const yaIncluida = activas.some(
      (asignatura) => asignatura.id === cursoActual.asignatura?.id,
    );

    return yaIncluida
      ? activas
      : [...activas, cursoActual.asignatura];
  }

  private construirDocentesEdicion(): Docente[] {
    const cursoActual = this.curso();
    const activos = this.estadoDocentes().filter((docente) => docente.activo);

    if (!cursoActual?.docente) {
      return activos;
    }

    const yaIncluido = activos.some(
      (docente) => docente.id === cursoActual.docente?.id,
    );

    return yaIncluido
      ? activos
      : [...activos, this.convertirDocenteReferencia(cursoActual.docente)];
  }

  private construirPuedeEditar(): boolean {
    const cursoActual = this.curso();

    if (!cursoActual) {
      return false;
    }

    if (cursoActual.estado === ESTADOS_CURSO.CANCELADO) {
      return false;
    }

    if (!cursoActual.periodoAcademico) {
      return true;
    }

    return this.permiteGestionarCursos(cursoActual.periodoAcademico.estado);
  }

  private convertirDocenteReferencia(
    referencia: ReferenciaDocenteCurso,
  ): Docente {
    return {
      id: referencia.id,
      identificacion: referencia.identificacion,
      nombres: referencia.nombres,
      apellidos: referencia.apellidos,
      correo: referencia.correo,
      telefono: null,
      especialidad: referencia.especialidad,
      activo: referencia.activo,
    };
  }

  private convertirPeriodoReferencia(
    referencia: ReferenciaPeriodoCurso,
  ): PeriodoAcademico {
    return {
      id: referencia.id,
      codigo: referencia.codigo,
      nombre: referencia.nombre,
      fecha_inicio: referencia.fecha_inicio,
      fecha_fin: referencia.fecha_fin,
      fecha_inicio_matricula: referencia.fecha_inicio_matricula,
      fecha_fin_matricula: referencia.fecha_fin_matricula,
      estado: referencia.estado as PeriodoAcademico['estado'],
      created_at: '',
      updated_at: '',
    };
  }

  private permiteGestionarCursos(estado: string): boolean {
    return (
      estado === ESTADOS_PERIODO_ACADEMICO.PLANIFICADO ||
      estado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA ||
      estado === ESTADOS_PERIODO_ACADEMICO.EN_CURSO
    );
  }

  private construirSolicitud() {
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
      return 'No fue posible actualizar el curso.';
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
    return cuerpo?.message || 'No fue posible actualizar el curso.';
  }

  private obtenerMensajeNoEncontrado(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'CURSO_NOT_FOUND') {
      return 'El curso solicitado no existe.';
    }

    if (cuerpo?.code === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El período académico seleccionado no existe.';
    }

    if (cuerpo?.code === 'ASIGNATURA_NOT_FOUND') {
      return 'La asignatura seleccionada no existe.';
    }

    if (cuerpo?.code === 'DOCENTE_NOT_FOUND') {
      return 'El docente seleccionado no existe.';
    }

    return 'El curso solicitado no existe.';
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

    if (cuerpo?.code === 'CUPO_INSUFICIENTE') {
      return 'El cupo máximo no puede ser menor que la cantidad de matriculados.';
    }

    if (cuerpo?.code === 'CURSO_CON_MATRICULAS') {
      return 'No se puede cambiar el período o la asignatura de un curso con matrículas activas.';
    }

    if (cuerpo?.code === 'CURSO_CANCELADO_NO_MODIFICABLE') {
      return 'No se puede modificar un curso cancelado.';
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
