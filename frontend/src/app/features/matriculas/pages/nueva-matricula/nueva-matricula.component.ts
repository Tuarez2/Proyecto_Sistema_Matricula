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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import {
  ESTADOS_PERIODO_ACADEMICO,
  type PeriodoAcademico,
} from '../../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../../periodos-academicos/services/periodos-academicos.service';
import type { Estudiante } from '../../../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../../../estudiantes/services/estudiantes.service';
import {
  type CursoDisponibleMatricula,
  type ResultadoLoteMatriculas,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';

interface ControlesBusquedaEstudiante {
  criterio: FormControl<string>;
}

const PASO_ESTUDIANTE = 1;
const PASO_PERIODO = 2;
const PASO_CURSOS = 3;
const PASO_CONFIRMACION = 4;

@Component({
  selector: 'app-nueva-matricula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './nueva-matricula.component.html',
  styleUrl: './nueva-matricula.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaMatriculaComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly periodosService = inject(PeriodosAcademicosService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoPasoActual = signal(PASO_ESTUDIANTE);
  private readonly estadoResultadosBusqueda = signal<Estudiante[]>([]);
  private readonly estadoEstudianteSeleccionado = signal<Estudiante | null>(null);
  private readonly estadoPeriodos = signal<PeriodoAcademico[]>([]);
  private readonly estadoPeriodoSeleccionado = signal<PeriodoAcademico | null>(null);
  private readonly estadoCursosDisponibles = signal<CursoDisponibleMatricula[]>([]);
  private readonly estadoCursosSeleccionados = signal<number[]>([]);
  private readonly estadoResultadoLote = signal<ResultadoLoteMatriculas | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly pasoActual = this.estadoPasoActual.asReadonly();
  readonly resultadosBusqueda = this.estadoResultadosBusqueda.asReadonly();
  readonly estudianteSeleccionado = this.estadoEstudianteSeleccionado.asReadonly();
  readonly periodos = this.estadoPeriodos.asReadonly();
  readonly periodoSeleccionado = this.estadoPeriodoSeleccionado.asReadonly();
  readonly cursosDisponibles = this.estadoCursosDisponibles.asReadonly();
  readonly cursosSeleccionados = this.estadoCursosSeleccionados.asReadonly();
  readonly resultadoLote = this.estadoResultadoLote.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly hayCursosSeleccionados = computed(
    () => this.estadoCursosSeleccionados().length > 0,
  );
  readonly cursosDisponiblesSeleccionables = computed(() =>
    this.estadoCursosDisponibles().filter((curso) => curso.disponible),
  );

  readonly formularioBusqueda = new FormGroup<ControlesBusquedaEstudiante>({
    criterio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
  });

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  buscarEstudiantes(): void {
    if (this.cargando()) {
      return;
    }

    const criterio = this.formularioBusqueda.getRawValue().criterio.trim();

    if (!criterio) {
      this.estadoMensajeError.set('Ingrese un criterio de búsqueda.');
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoCargando.set(true);
    this.estudiantesService.listarEstudiantes({
      numero_matricula: criterio,
      identificacion: criterio,
      nombres: criterio,
      apellidos: criterio,
      limite: 50,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoResultadosBusqueda.set(respuesta.data ?? []);
        },
        error: (error: unknown) => {
          this.estadoResultadosBusqueda.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  seleccionarEstudiante(estudiante: Estudiante): void {
    this.estadoEstudianteSeleccionado.set(estudiante);
    this.estadoMensajeError.set(null);
    this.estadoPasoActual.set(PASO_PERIODO);
  }

  seleccionarPeriodo(periodo: PeriodoAcademico): void {
    this.estadoPeriodoSeleccionado.set(periodo);
    this.estadoMensajeError.set(null);
    this.estadoPasoActual.set(PASO_CURSOS);
    this.cargarCursosDisponibles();
  }

  alternarCurso(idCurso: number): void {
    this.estadoCursosSeleccionados.update((seleccionados) =>
      seleccionados.includes(idCurso)
        ? seleccionados.filter((id) => id !== idCurso)
        : [...seleccionados, idCurso],
    );
  }

  continuarAConfirmacion(): void {
    if (!this.hayCursosSeleccionados()) {
      this.estadoMensajeError.set('Seleccione al menos un curso.');
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoPasoActual.set(PASO_CONFIRMACION);
  }

  registrarMatricula(): void {
    const estudiante = this.estudianteSeleccionado();
    const cursos = this.estadoCursosSeleccionados();

    if (!estudiante || cursos.length === 0 || this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoEnviando.set(true);
    this.matriculasService.crearMatriculasLote({
      estudiante_id: estudiante.id,
      curso_ids: cursos,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoResultadoLote.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  reiniciarFlujo(): void {
    this.estadoPasoActual.set(PASO_ESTUDIANTE);
    this.estadoEstudianteSeleccionado.set(null);
    this.estadoPeriodoSeleccionado.set(null);
    this.estadoCursosDisponibles.set([]);
    this.estadoCursosSeleccionados.set([]);
    this.estadoResultadoLote.set(null);
    this.estadoResultadosBusqueda.set([]);
    this.estadoMensajeError.set(null);
    this.formularioBusqueda.reset({ criterio: '' });
  }

  volverAlPasoAnterior(): void {
    this.estadoMensajeError.set(null);

    switch (this.pasoActual()) {
      case PASO_PERIODO:
        this.estadoEstudianteSeleccionado.set(null);
        this.estadoPasoActual.set(PASO_ESTUDIANTE);
        break;
      case PASO_CURSOS:
        this.estadoPeriodoSeleccionado.set(null);
        this.estadoCursosDisponibles.set([]);
        this.estadoCursosSeleccionados.set([]);
        this.estadoPasoActual.set(PASO_PERIODO);
        break;
      case PASO_CONFIRMACION:
        this.estadoPasoActual.set(PASO_CURSOS);
        break;
      default:
        break;
    }
  }

  imprimir(): void {
    window.print();
  }

  obtenerNombreCompleto(estudiante: Estudiante): string {
    return `${estudiante.nombres} ${estudiante.apellidos}`.trim();
  }

  obtenerNombreCurso(curso: CursoDisponibleMatricula): string {
    const asignatura = curso.asignatura;

    if (!asignatura) {
      return `Curso ${curso.id}`;
    }

    return `${asignatura.codigo} - ${asignatura.nombre} (${curso.paralelo})`;
  }

  estaSeleccionado(idCurso: number): boolean {
    return this.estadoCursosSeleccionados().includes(idCurso);
  }

  private cargarPeriodos(): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.periodosService.listarPeriodos({ limite: 100 })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const periodosAbiertos = (respuesta.data ?? [])
            .filter((periodo) => periodo.estado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA)
            .sort((a, b) => b.id - a.id);
          this.estadoPeriodos.set(periodosAbiertos);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private cargarCursosDisponibles(): void {
    const estudiante = this.estudianteSeleccionado();
    const periodo = this.periodoSeleccionado();

    if (!estudiante || !periodo) {
      return;
    }

    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.estudiantesService.obtenerCursosDisponibles(estudiante.id, periodo.id)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const cursos = respuesta.data?.cursos ?? [];
          this.estadoCursosDisponibles.set(cursos);
          this.estadoCursosSeleccionados.set(
            cursos.filter((curso) => curso.disponible).map((curso) => curso.id),
          );
        },
        error: (error: unknown) => {
          this.estadoCursosDisponibles.set([]);
          this.estadoCursosSeleccionados.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
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
      return 'Ocurrió un error del servidor al procesar la matrícula.';
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
      return 'Uno o más cursos no existen.';
    }

    if (cuerpo?.code === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El periodo académico no existe.';
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
      return 'El estudiante ya tiene una matrícula registrada para uno de los cursos.';
    }

    if (cuerpo?.code === 'ESTUDIANTE_NO_HABILITADO') {
      return 'El estado académico del estudiante no permite matrícula.';
    }

    if (cuerpo?.code === 'ESTUDIANTE_SIN_CARRERA') {
      return 'El estudiante no tiene una carrera activa asociada.';
    }

    if (cuerpo?.code === 'CURSO_NO_DISPONIBLE') {
      return 'Uno de los cursos no está disponible para matrículas.';
    }

    if (cuerpo?.code === 'CURSO_SIN_CUPOS') {
      return 'Uno de los cursos no tiene cupos disponibles.';
    }

    if (cuerpo?.code === 'CURSOS_DE_DISTINTOS_PERIODOS') {
      return 'Los cursos deben pertenecer al mismo periodo académico.';
    }

    if (cuerpo?.code === 'PERIODO_NO_PERMITE_MATRICULA') {
      return 'El periodo académico no permite registrar matrículas.';
    }

    if (cuerpo?.code === 'PERIODO_FUERA_DE_VENTANA_MATRICULA') {
      return 'La fecha actual está fuera de la ventana de matrícula.';
    }

    if (cuerpo?.code === 'ASIGNATURA_FUERA_DE_MALLA') {
      return 'Una de las asignaturas no pertenece a la malla curricular del estudiante.';
    }

    return cuerpo?.message || 'No fue posible completar la matrícula.';
  }
}
