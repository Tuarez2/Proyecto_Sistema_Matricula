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
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  debounceTime,
  filter,
  finalize,
  map,
  merge,
  switchMap,
  tap,
} from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import type { Asignatura } from '../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../asignaturas/services/asignaturas.service';
import type { Docente } from '../../docentes/models/docente.model';
import { DocentesService } from '../../docentes/services/docentes.service';
import type { PeriodoAcademico } from '../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../periodos-academicos/services/periodos-academicos.service';
import {
  ESTADOS_CURSO,
  type Curso,
  type EstadoCurso,
  type FiltrosCursos,
  type RespuestaListadoCursos,
} from '../models/curso.model';
import { CursosService } from '../services/cursos.service';

interface ControlesFiltrosCursos {
  periodo_id: FormControl<string>;
  asignatura_id: FormControl<string>;
  docente_id: FormControl<string>;
  estado: FormControl<string>;
  paralelo: FormControl<string>;
}

interface CambioConsulta {
  reiniciarPagina: boolean;
}

const LIMITE_POR_PAGINA = 10;
const DEBOUNCE_BUSQUEDA_MS = 350;

@Component({
  selector: 'app-listado-cursos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PaginationComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './listado-cursos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoCursosComponent implements OnInit {
  private readonly servicio = inject(CursosService);
  private readonly periodosServicio = inject(PeriodosAcademicosService);
  private readonly asignaturasServicio = inject(AsignaturasService);
  private readonly docentesServicio = inject(DocentesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoCursos = signal<Curso[]>([]);
  private readonly estadoPeriodos = signal<PeriodoAcademico[]>([]);
  private readonly estadoAsignaturas = signal<Asignatura[]>([]);
  private readonly estadoDocentes = signal<Docente[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoTotalRegistros = signal(0);
  private readonly estadoCursoProcesando = signal<number | null>(null);
  private readonly estadoCursoSeleccionado = signal<Curso | null>(null);
  private readonly estadoDialogoAbierto = signal(false);
  private readonly estadoDialogoTitulo = signal('');
  private readonly estadoDialogoMensaje = signal('');
  private readonly estadoDialogoPeligroso = signal(false);
  private readonly estadoDialogoProcesando = signal(false);
  private readonly estadoFiltrosAplicados = signal<FiltrosCursos>({});
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

  readonly cursos = this.estadoCursos.asReadonly();
  readonly periodos = this.estadoPeriodos.asReadonly();
  readonly asignaturas = this.estadoAsignaturas.asReadonly();
  readonly docentes = this.estadoDocentes.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly totalRegistros = this.estadoTotalRegistros.asReadonly();
  readonly cursoProcesando = this.estadoCursoProcesando.asReadonly();
  readonly dialogoAbierto = this.estadoDialogoAbierto.asReadonly();
  readonly dialogoTitulo = this.estadoDialogoTitulo.asReadonly();
  readonly dialogoMensaje = this.estadoDialogoMensaje.asReadonly();
  readonly dialogoPeligroso = this.estadoDialogoPeligroso.asReadonly();
  readonly dialogoProcesando = this.estadoDialogoProcesando.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()?.rol?.codigo ===
      CODIGOS_ROL.ADMIN,
  );
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );

  readonly filtros = new FormGroup<ControlesFiltrosCursos>({
    periodo_id: new FormControl('', { nonNullable: true }),
    asignatura_id: new FormControl('', { nonNullable: true }),
    docente_id: new FormControl('', { nonNullable: true }),
    estado: new FormControl('', { nonNullable: true }),
    paralelo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(10)],
    }),
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.configurarFiltrosDinamicos();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  cargarCursos(): void {
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  buscar(): void {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoFiltrosAplicados.set(this.obtenerFiltrosAplicables());
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  impedirEnvio(evento: Event): void {
    evento.preventDefault();
  }

  limpiarFiltros(): void {
    this.estadoMensajeError.set(null);
    this.estadoFiltrosAplicados.set({});
    this.estadoPaginaActual.set(1);
    this.filtros.reset(
      {
        periodo_id: '',
        asignatura_id: '',
        docente_id: '',
        estado: '',
        paralelo: '',
      },
      { emitEvent: false },
    );
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (pagina === this.paginaActual() || this.cargando()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cancelarCurso(curso: Curso): void {
    if (
      !this.esAdministrador() ||
      curso.estado === ESTADOS_CURSO.CANCELADO ||
      this.cursoProcesando() !== null
    ) {
      return;
    }

    this.estadoCursoSeleccionado.set(curso);
    this.estadoDialogoTitulo.set('Cancelar curso');
    this.estadoDialogoMensaje.set(
      `¿Desea cancelar el curso ${this.obtenerNombreAsignatura(curso)} (${curso.paralelo})? Los estudiantes matriculados se conservan, pero no se permitirán matrículas nuevas ni modificaciones.`,
    );
    this.estadoDialogoPeligroso.set(true);
    this.estadoDialogoAbierto.set(true);
  }

  confirmarCancelacion(): void {
    const curso = this.estadoCursoSeleccionado();

    if (!curso) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoCursoProcesando.set(curso.id);
    this.estadoDialogoProcesando.set(true);
    this.servicio
      .cancelarCurso(curso.id)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => {
          this.estadoCursoProcesando.set(null);
          this.estadoDialogoProcesando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Curso cancelado correctamente.',
          );
          this.estadoDialogoAbierto.set(false);
          this.cargarCursos();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cerrarDialogo(): void {
    if (this.estadoDialogoProcesando()) {
      return;
    }

    this.estadoDialogoAbierto.set(false);
    this.estadoCursoSeleccionado.set(null);
  }

  obtenerNombreAsignatura(curso: Curso): string {
    if (!curso.asignatura) {
      return `Curso ${curso.id}`;
    }

    return `${curso.asignatura.codigo} - ${curso.asignatura.nombre}`;
  }

  obtenerNombreDocente(curso: Curso): string {
    if (!curso.docente) {
      return 'Sin docente';
    }

    return `${curso.docente.nombres} ${curso.docente.apellidos}`.trim();
  }

  obtenerNombrePeriodo(curso: Curso): string {
    return curso.periodoAcademico?.nombre ?? 'Sin período';
  }

  obtenerEtiquetaEstado(curso: Curso): string {
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

  obtenerClaseEstado(curso: Curso): string {
    if (curso.estado === ESTADOS_CURSO.ABIERTO) {
      return 'estado-badge--success';
    }

    if (curso.estado === ESTADOS_CURSO.CERRADO) {
      return 'estado-badge--neutral';
    }

    return 'estado-badge--danger';
  }

  private cargarCatalogos(): void {
    this.periodosServicio
      .listarPeriodos({ limite: 100 })
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => this.estadoPeriodos.set(respuesta.data ?? []),
        error: () => {
          this.estadoMensajeError.set(
            'No fue posible cargar los períodos académicos para los filtros.',
          );
        },
      });

    this.asignaturasServicio
      .listarAsignaturas({ limite: 100 })
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) =>
          this.estadoAsignaturas.set(respuesta.data ?? []),
        error: () => {
          this.estadoMensajeError.set(
            'No fue posible cargar las asignaturas para los filtros.',
          );
        },
      });

    this.docentesServicio
      .listarDocentes({ limite: 100 })
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe({
        next: (respuesta) => this.estadoDocentes.set(respuesta.data ?? []),
        error: () => {
          this.estadoMensajeError.set(
            'No fue posible cargar los docentes para los filtros.',
          );
        },
      });
  }

  private configurarFiltrosDinamicos(): void {
    const textoDebounced = this.filtros.controls.paralelo.valueChanges.pipe(
      debounceTime(DEBOUNCE_BUSQUEDA_MS),
      map(() => true),
    );

    const selectoresInmediatos = merge(
      this.filtros.controls.periodo_id.valueChanges,
      this.filtros.controls.asignatura_id.valueChanges,
      this.filtros.controls.docente_id.valueChanges,
      this.filtros.controls.estado.valueChanges,
    ).pipe(map(() => true));

    merge(textoDebounced, selectoresInmediatos)
      .pipe(
        filter(() => this.filtros.valid && !this.criteriosIgualesAplicados()),
        takeUntilDestroyed(this.destruccion),
      )
      .subscribe(() => this.consultaFiltros$.next({ reiniciarPagina: true }));

    this.consultaFiltros$
      .pipe(
        switchMap((cambio) => {
          if (cambio.reiniciarPagina) {
            this.estadoPaginaActual.set(1);
          }
          return this.consultarCursos();
        }),
        takeUntilDestroyed(this.destruccion),
      )
      .subscribe();
  }

  private criteriosIgualesAplicados(): boolean {
    return (
      JSON.stringify(this.obtenerFiltrosAplicables()) ===
      JSON.stringify(this.estadoFiltrosAplicados())
    );
  }

  private contarFiltros(filtros: FiltrosCursos): number {
    return [
      'periodo_id',
      'asignatura_id',
      'docente_id',
      'estado',
      'paralelo',
    ].filter(
      (clave) => filtros[clave as keyof FiltrosCursos] !== undefined,
    ).length;
  }

  private consultarCursos(): Observable<RespuestaListadoCursos> {
    const filtros = this.obtenerFiltrosAplicables();
    this.estadoFiltrosAplicados.set(filtros);
    this.estadoMensajeError.set(null);
    this.estadoCargando.set(true);
    return this.servicio
      .listar({
        ...filtros,
        pagina: this.estadoPaginaActual(),
        limite: LIMITE_POR_PAGINA,
      })
      .pipe(
        finalize(() => this.estadoCargando.set(false)),
        tap({
          next: (respuesta) => {
            this.estadoCursos.set(respuesta.data ?? []);
            this.estadoPaginaActual.set(respuesta.page);
            this.estadoTotalPaginas.set(respuesta.totalPages);
            this.estadoTotalRegistros.set(respuesta.total);
          },
        }),
        catchError((error: unknown) => {
          this.estadoCursos.set([]);
          this.estadoTotalPaginas.set(1);
          this.estadoTotalRegistros.set(0);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          return EMPTY;
        }),
      );
  }

  private obtenerFiltrosAplicables(): FiltrosCursos {
    const valores = this.filtros.getRawValue();

    return {
      periodo_id: this.obtenerIdentificador(valores.periodo_id),
      asignatura_id: this.obtenerIdentificador(valores.asignatura_id),
      docente_id: this.obtenerIdentificador(valores.docente_id),
      estado: this.obtenerEstadoFiltro(valores.estado),
      paralelo: valores.paralelo.trim() || undefined,
    };
  }

  private obtenerIdentificador(valor: string): number | undefined {
    const numero = Number(valor);

    return Number.isInteger(numero) && numero > 0 ? numero : undefined;
  }

  private obtenerEstadoFiltro(valor: string): EstadoCurso | undefined {
    if (
      valor === ESTADOS_CURSO.ABIERTO ||
      valor === ESTADOS_CURSO.CERRADO ||
      valor === ESTADOS_CURSO.CANCELADO
    ) {
      return valor;
    }

    return undefined;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible gestionar los cursos.';
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

    if (error.status === 400) {
      return 'Revise los filtros de la consulta de cursos.';
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar los cursos.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible gestionar los cursos.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'CURSO_DUPLICADO') {
      return 'Ya existe un curso con el mismo período, asignatura y paralelo.';
    }

    if (cuerpo?.code === 'CUPO_INSUFICIENTE') {
      return 'El cupo máximo no puede ser menor que la cantidad de matriculados.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos del curso.';
  }
}