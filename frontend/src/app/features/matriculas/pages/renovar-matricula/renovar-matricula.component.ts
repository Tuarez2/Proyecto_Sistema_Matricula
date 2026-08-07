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
import type { PeriodoAcademico } from '../../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../../periodos-academicos/services/periodos-academicos.service';
import type { Estudiante } from '../../../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../../../estudiantes/services/estudiantes.service';
import type {
  CursoDisponibleMatricula,
  Matricula,
  ResultadoLoteMatriculas,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';

interface ControlesBusquedaEstudiante {
  criterio: FormControl<string>;
}

interface ReferenciaAsignatura {
  asignatura_id: number;
  codigo: string;
  nombre: string;
}

interface CursoRenovacion {
  curso: CursoDisponibleMatricula;
  seleccionado: boolean;
}

interface GrupoRenovacion {
  asignaturaId: number;
  codigo: string;
  nombre: string;
  sinOferta: boolean;
  cursos: CursoRenovacion[];
}

const PASO_ESTUDIANTE = 1;
const PASO_PERIODO = 2;
const PASO_REVISION = 3;

@Component({
  selector: 'app-renovar-matricula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './renovar-matricula.component.html',
  styleUrl: './renovar-matricula.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenovarMatriculaComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly periodosService = inject(PeriodosAcademicosService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoPasoActual = signal(PASO_ESTUDIANTE);
  private readonly estadoResultadosBusqueda = signal<Estudiante[]>([]);
  private readonly estadoEstudianteSeleccionado = signal<Estudiante | null>(null);
  private readonly estadoPeriodos = signal<PeriodoAcademico[]>([]);
  private readonly estadoPeriodoSeleccionado = signal<PeriodoAcademico | null>(null);
  private readonly estadoPeriodoAnterior = signal<PeriodoAcademico | null>(null);
  private readonly estadoCursosRenovacion = signal<GrupoRenovacion[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoResultadoLote = signal<ResultadoLoteMatriculas | null>(null);

  readonly pasoActual = this.estadoPasoActual.asReadonly();
  readonly resultadosBusqueda = this.estadoResultadosBusqueda.asReadonly();
  readonly estudianteSeleccionado = this.estadoEstudianteSeleccionado.asReadonly();
  readonly periodos = this.estadoPeriodos.asReadonly();
  readonly periodoSeleccionado = this.estadoPeriodoSeleccionado.asReadonly();
  readonly periodoAnterior = this.estadoPeriodoAnterior.asReadonly();
  readonly cursosRenovacion = this.estadoCursosRenovacion.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly resultadoLote = this.estadoResultadoLote.asReadonly();
  readonly cursosSeleccionados = computed(() =>
    this.estadoCursosRenovacion()
      .flatMap((grupo) => grupo.cursos)
      .filter((item) => item.seleccionado)
      .map((item) => item.curso.id),
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
    this.prepararCursosRenovacion(periodo);
  }

  alternarCurso(idCurso: number): void {
    this.estadoCursosRenovacion.update((grupos) =>
      grupos.map((grupo) => ({
        ...grupo,
        cursos: grupo.cursos.map((item) =>
          item.curso.id === idCurso
            ? { ...item, seleccionado: !item.seleccionado }
            : item,
        ),
      })),
    );
  }

  registrarRenovacion(): void {
    const estudiante = this.estudianteSeleccionado();
    const cursoIds = this.cursosSeleccionados();

    if (!estudiante || cursoIds.length === 0 || this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoEnviando.set(true);
    this.matriculasService.crearMatriculasLote({
      estudiante_id: estudiante.id,
      curso_ids: cursoIds,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoResultadoLote.set(respuesta.data ?? null);
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Matrícula renovada correctamente.',
          );
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
    this.estadoPeriodoAnterior.set(null);
    this.estadoCursosRenovacion.set([]);
    this.estadoResultadoLote.set(null);
    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.formularioBusqueda.reset({ criterio: '' });
  }

  volverAlPasoAnterior(): void {
    this.estadoMensajeError.set(null);

    if (this.pasoActual() === PASO_PERIODO) {
      this.estadoEstudianteSeleccionado.set(null);
      this.estadoPasoActual.set(PASO_ESTUDIANTE);
    }
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
    return this.estadoCursosRenovacion().some((grupo) =>
      grupo.cursos.some(
        (item) => item.curso.id === idCurso && item.seleccionado,
      ),
    );
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
          this.estadoPeriodos.set(
            (respuesta.data ?? []).sort((a, b) => b.id - a.id),
          );
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private prepararCursosRenovacion(periodo: PeriodoAcademico): void {
    const estudiante = this.estudianteSeleccionado();

    if (!estudiante) {
      return;
    }

    const periodoAnterior = this.obtenerPeriodoAnterior(periodo);

    if (!periodoAnterior) {
      this.estadoMensajeError.set(
        'No se encontró un periodo anterior del cual renovar la matrícula.',
      );
      return;
    }

    this.estadoPeriodoAnterior.set(periodoAnterior);
    this.estadoMensajeError.set(null);
    this.estadoCargando.set(true);

    this.matriculasService.listarMatriculas({
      estudiante_id: estudiante.id,
      periodo_id: periodoAnterior.id,
      limit: 100,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const asignaturasAnteriores = this.obtenerAsignaturasAnteriores(
            respuesta.data ?? [],
          );
          this.cargarOfertaReal(periodo, asignaturasAnteriores);
        },
        error: (error: unknown) => {
          this.estadoCursosRenovacion.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private cargarOfertaReal(
    periodo: PeriodoAcademico,
    asignaturasAnteriores: Map<number, ReferenciaAsignatura>,
  ): void {
    const estudiante = this.estudianteSeleccionado();

    if (!estudiante) {
      return;
    }

    this.estadoCargando.set(true);
    this.estudiantesService.obtenerCursosDisponibles(estudiante.id, periodo.id)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const cursosOferta = respuesta.data?.cursos ?? [];

          this.estadoCursosRenovacion.set(
            this.construirGrupos(cursosOferta, asignaturasAnteriores),
          );
          this.estadoPasoActual.set(PASO_REVISION);
        },
        error: (error: unknown) => {
          this.estadoCursosRenovacion.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private construirGrupos(
    cursosOferta: CursoDisponibleMatricula[],
    asignaturasAnteriores: Map<number, ReferenciaAsignatura>,
  ): GrupoRenovacion[] {
    const grupos: GrupoRenovacion[] = [];

    for (const [asignaturaId, referencia] of asignaturasAnteriores) {
      const cursosDeAsignatura = cursosOferta.filter(
        (curso) => curso.asignatura_id === asignaturaId,
      );

      if (cursosDeAsignatura.length === 0) {
        grupos.push({
          asignaturaId,
          codigo: referencia.codigo,
          nombre: referencia.nombre,
          sinOferta: true,
          cursos: [],
        });
        continue;
      }

      const preseleccionar = cursosDeAsignatura.length === 1;

      grupos.push({
        asignaturaId,
        codigo: referencia.codigo,
        nombre: referencia.nombre,
        sinOferta: false,
        cursos: cursosDeAsignatura.map((curso) => ({
          curso,
          seleccionado: preseleccionar,
        })),
      });
    }

    return grupos;
  }

  private obtenerAsignaturasAnteriores(
    matriculas: Matricula[],
  ): Map<number, ReferenciaAsignatura> {
    const asignaturas = new Map<number, ReferenciaAsignatura>();

    for (const matricula of matriculas) {
      const asignatura = matricula.curso?.asignatura;

      if (!asignatura) {
        continue;
      }

      if (!asignaturas.has(asignatura.id)) {
        asignaturas.set(asignatura.id, {
          asignatura_id: asignatura.id,
          codigo: asignatura.codigo,
          nombre: asignatura.nombre,
        });
      }
    }

    return asignaturas;
  }

  private obtenerPeriodoAnterior(periodo: PeriodoAcademico): PeriodoAcademico | null {
    const fechaInicioObjetivo = new Date(`${periodo.fecha_inicio}T00:00:00`);

    const anteriores = this.estadoPeriodos().filter((candidato) => {
      const fechaFin = new Date(`${candidato.fecha_fin}T23:59:59`);

      return fechaFin < fechaInicioObjetivo;
    });

    anteriores.sort((a, b) => {
      const fechaFinA = new Date(`${a.fecha_fin}T00:00:00`).getTime();
      const fechaFinB = new Date(`${b.fecha_fin}T00:00:00`).getTime();

      return fechaFinB - fechaFinA;
    });

    return anteriores[0] ?? null;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible renovar la matrícula.';
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
      return 'Ocurrió un error del servidor al renovar la matrícula.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible renovar la matrícula.';
  }

  private obtenerMensajeNoEncontrado(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'ESTUDIANTE_NOT_FOUND') {
      return 'El estudiante seleccionado no existe.';
    }

    if (cuerpo?.code === 'CURSO_NOT_FOUND') {
      return 'Uno o más cursos no existen.';
    }

    return cuerpo?.message || 'El recurso solicitado no existe.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos de la renovación.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'MATRICULA_DUPLICADA') {
      return 'El estudiante ya tiene una matrícula registrada para uno de los cursos.';
    }

    if (cuerpo?.code === 'ESTUDIANTE_NO_HABILITADO') {
      return 'El estado académico del estudiante no permite matrícula.';
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

    return cuerpo?.message || 'No fue posible completar la renovación.';
  }
}