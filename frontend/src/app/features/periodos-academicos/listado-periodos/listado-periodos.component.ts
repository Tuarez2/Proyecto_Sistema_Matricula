import { HttpErrorResponse } from '@angular/common/http';
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
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import {
  ESTADOS_PERIODO_ACADEMICO,
  TRANSICIONES_PERIODO_ACADEMICO,
  type EstadoPeriodoAcademico,
  type FiltrosListadoPeriodos,
  type PeriodoAcademico,
  type RespuestaListadoPeriodos,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';

interface CambioConsulta {
  reiniciarPagina: boolean;
}

const LIMITE_POR_PAGINA = 10;
const DEBOUNCE_BUSQUEDA_MS = 350;

@Component({
  selector: 'app-listado-periodos',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PaginationComponent,
    FechaPipe,
  ],
  templateUrl: './listado-periodos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoPeriodosComponent implements OnInit {
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly periodosAcademicosService = inject(PeriodosAcademicosService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoPeriodos = signal<PeriodoAcademico[]>([]);
  private readonly estadoCargandoPeriodos = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoLimitePorPagina = signal(10);
  private readonly estadoTotalPeriodos = signal(0);
  private readonly estadoTotalPaginas = signal(0);
  private readonly estadoFiltrosAplicados = signal<FiltrosListadoPeriodos>({});
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

  readonly ESTADOS_PERIODO_ACADEMICO = ESTADOS_PERIODO_ACADEMICO;
  readonly periodos = this.estadoPeriodos.asReadonly();
  readonly cargandoPeriodos = this.estadoCargandoPeriodos.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly limitePorPagina = this.estadoLimitePorPagina.asReadonly();
  readonly totalPeriodos = this.estadoTotalPeriodos.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly puedeIrPaginaAnterior = computed(
    () => this.paginaActual() > 1 && !this.cargandoPeriodos(),
  );
  readonly puedeIrPaginaSiguiente = computed(
    () =>
      this.totalPaginas() > 0 &&
      this.paginaActual() < this.totalPaginas() &&
      !this.cargandoPeriodos(),
  );
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );
  readonly formularioFiltros = this.constructorFormulario.nonNullable.group(
    {
      codigo: ['', [Validators.maxLength(20)]],
      nombre: ['', [Validators.maxLength(100)]],
      estado: [''],
      anio: ['', [this.crearValidadorAnio()]],
      fechaInicio: [''],
      fechaFin: [''],
    },
    {
      validators: [this.crearValidadorRangoFechas()],
    },
  );

  ngOnInit(): void {
    this.configurarFiltrosDinamicos();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  buscarPeriodos(): void {
    if (this.formularioFiltros.invalid) {
      this.formularioFiltros.markAllAsTouched();
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
    this.formularioFiltros.reset(
      {
        codigo: '',
        nombre: '',
        estado: '',
        anio: '',
        fechaInicio: '',
        fechaFin: '',
      },
      { emitEvent: false },
    );
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  paginaAnterior(): void {
    if (!this.puedeIrPaginaAnterior()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual - 1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  paginaSiguiente(): void {
    if (!this.puedeIrPaginaSiguiente()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual + 1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (this.cargandoPeriodos() || pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cargarPeriodos(): void {
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  obtenerEtiquetaEstado(estado: EstadoPeriodoAcademico): string {
    if (estado === ESTADOS_PERIODO_ACADEMICO.PLANIFICADO) {
      return 'Planificado';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA) {
      return 'Matrícula abierta';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.EN_CURSO) {
      return 'En curso';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.CERRADO) {
      return 'Cerrado';
    }

    return 'Estado desconocido';
  }

  obtenerClaseEstado(estado: EstadoPeriodoAcademico): string {
    if (estado === ESTADOS_PERIODO_ACADEMICO.CERRADO) {
      return 'estado-badge--neutral';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.EN_CURSO) {
      return 'estado-badge--info';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA) {
      return 'estado-badge--success';
    }

    return 'estado-badge--warning';
  }

  tieneTransicionesDisponibles(estado: EstadoPeriodoAcademico): boolean {
    return TRANSICIONES_PERIODO_ACADEMICO[estado].length > 0;
  }

  private configurarFiltrosDinamicos(): void {
    const textoDebounced = merge(
      this.formularioFiltros.controls.codigo.valueChanges,
      this.formularioFiltros.controls.nombre.valueChanges,
      this.formularioFiltros.controls.anio.valueChanges,
      this.formularioFiltros.controls.fechaInicio.valueChanges,
      this.formularioFiltros.controls.fechaFin.valueChanges,
    ).pipe(
      debounceTime(DEBOUNCE_BUSQUEDA_MS),
      map(() => true),
    );

    const selectoresInmediatos = this.formularioFiltros.controls.estado.valueChanges.pipe(
      map(() => true),
    );

    merge(textoDebounced, selectoresInmediatos)
      .pipe(
        filter(() => this.formularioFiltros.valid && !this.criteriosIgualesAplicados()),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe(() => this.consultaFiltros$.next({ reiniciarPagina: true }));

    this.consultaFiltros$
      .pipe(
        switchMap((cambio) => {
          if (cambio.reiniciarPagina) {
            this.estadoPaginaActual.set(1);
          }
          return this.consultarPeriodos();
        }),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe();
  }

  private criteriosIgualesAplicados(): boolean {
    return (
      JSON.stringify(this.obtenerFiltrosAplicables()) ===
      JSON.stringify(this.estadoFiltrosAplicados())
    );
  }

  private contarFiltros(filtros: FiltrosListadoPeriodos): number {
    return (
      ['codigo', 'nombre', 'estado', 'anio', 'fechaInicio', 'fechaFin'].filter(
        (clave) =>
          filtros[clave as keyof FiltrosListadoPeriodos] !== undefined,
      ).length
    );
  }

  private consultarPeriodos(): Observable<RespuestaListadoPeriodos> {
    const filtros = this.obtenerFiltrosAplicables();
    this.estadoFiltrosAplicados.set(filtros);
    this.estadoMensajeError.set(null);
    this.estadoCargandoPeriodos.set(true);
    return this.periodosAcademicosService.listarPeriodos({
      ...filtros,
      pagina: this.estadoPaginaActual(),
      limite: LIMITE_POR_PAGINA,
    }).pipe(
      finalize(() => this.estadoCargandoPeriodos.set(false)),
      tap({
        next: (respuesta) => {
          this.estadoMensajeError.set(null);
          this.estadoPeriodos.set(respuesta.data ?? []);
          this.estadoPaginaActual.set(respuesta.page);
          this.estadoLimitePorPagina.set(respuesta.limit);
          this.estadoTotalPeriodos.set(respuesta.total);
          this.estadoTotalPaginas.set(respuesta.totalPages);
        },
      }),
      catchError((error: unknown) => {
        this.estadoPeriodos.set([]);
        this.estadoTotalPeriodos.set(0);
        this.estadoTotalPaginas.set(0);
        this.estadoMensajeError.set(this.obtenerMensajeError(error));
        return EMPTY;
      }),
    );
  }

  private obtenerFiltrosAplicables(): FiltrosListadoPeriodos {
    const valoresFormulario = this.formularioFiltros.getRawValue();
    const filtros: FiltrosListadoPeriodos = {};
    const codigo = valoresFormulario.codigo.trim();
    const nombre = valoresFormulario.nombre.trim();
    const anio = Number(valoresFormulario.anio);

    if (codigo) {
      filtros.codigo = codigo;
    }

    if (nombre) {
      filtros.nombre = nombre;
    }

    if (this.esEstadoPeriodoAcademico(valoresFormulario.estado)) {
      filtros.estado = valoresFormulario.estado;
    }

    if (
      valoresFormulario.anio &&
      Number.isInteger(anio) &&
      anio >= 1900 &&
      anio <= 2200
    ) {
      filtros.anio = anio;
    }

    if (valoresFormulario.fechaInicio) {
      filtros.fechaInicio = valoresFormulario.fechaInicio;
    }

    if (valoresFormulario.fechaFin) {
      filtros.fechaFin = valoresFormulario.fechaFin;
    }

    return filtros;
  }

  private crearValidadorAnio(): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const valor = control.value;

      if (!valor) {
        return null;
      }

      const anio = Number(valor);

      if (!Number.isInteger(anio)) {
        return {
          anioDecimal: true,
        };
      }

      if (anio < 1900) {
        return {
          min: {
            min: 1900,
            actual: anio,
          },
        };
      }

      if (anio > 2200) {
        return {
          max: {
            max: 2200,
            actual: anio,
          },
        };
      }

      return null;
    };
  }

  private crearValidadorRangoFechas(): ValidatorFn {
    return (control): ValidationErrors | null => {
      const fechaInicio = control.get('fechaInicio')?.value;
      const fechaFin = control.get('fechaFin')?.value;

      if (
        typeof fechaInicio !== 'string' ||
        typeof fechaFin !== 'string' ||
        !fechaInicio ||
        !fechaFin ||
        fechaInicio <= fechaFin
      ) {
        return null;
      }

      return {
        rangoFechasInvalido: true,
      };
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar los periodos académicos.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 400) {
      return 'Revise los filtros ingresados.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar periodos académicos.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al consultar los periodos.';
    }

    return 'No fue posible consultar los periodos académicos.';
  }

  private esEstadoPeriodoAcademico(
    valor: string,
  ): valor is EstadoPeriodoAcademico {
    return Object.values(ESTADOS_PERIODO_ACADEMICO).some(
      (estado) => estado === valor,
    );
  }
}
