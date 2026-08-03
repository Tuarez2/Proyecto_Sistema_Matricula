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
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import {
  ESTADOS_PERIODO_ACADEMICO,
  TRANSICIONES_PERIODO_ACADEMICO,
  type EstadoPeriodoAcademico,
  type FiltrosListadoPeriodos,
  type PeriodoAcademico,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';

@Component({
  selector: 'app-listado-periodos',
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
    this.cargarPeriodos();
  }

  buscarPeriodos(): void {
    if (this.cargandoPeriodos()) {
      return;
    }

    if (this.formularioFiltros.invalid) {
      this.formularioFiltros.markAllAsTouched();
      return;
    }

    this.estadoPaginaActual.set(1);
    this.cargarPeriodos();
  }

  limpiarFiltros(): void {
    if (this.cargandoPeriodos()) {
      return;
    }

    this.formularioFiltros.reset({
      codigo: '',
      nombre: '',
      estado: '',
      anio: '',
      fechaInicio: '',
      fechaFin: '',
    });
    this.estadoPaginaActual.set(1);
    this.cargarPeriodos();
  }

  paginaAnterior(): void {
    if (!this.puedeIrPaginaAnterior()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual - 1);
    this.cargarPeriodos();
  }

  paginaSiguiente(): void {
    if (!this.puedeIrPaginaSiguiente()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual + 1);
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    if (this.cargandoPeriodos()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoCargandoPeriodos.set(true);
    this.periodosAcademicosService.listarPeriodos(this.obtenerFiltrosPeriodos())
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoPeriodos.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoPeriodos.set(respuesta.data ?? []);
          this.estadoPaginaActual.set(respuesta.page);
          this.estadoLimitePorPagina.set(respuesta.limit);
          this.estadoTotalPeriodos.set(respuesta.total);
          this.estadoTotalPaginas.set(respuesta.totalPages);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
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

  tieneTransicionesDisponibles(estado: EstadoPeriodoAcademico): boolean {
    return TRANSICIONES_PERIODO_ACADEMICO[estado].length > 0;
  }

  private obtenerFiltrosPeriodos(): FiltrosListadoPeriodos {
    const valoresFormulario = this.formularioFiltros.getRawValue();
    const filtros: FiltrosListadoPeriodos = {
      pagina: this.paginaActual(),
      limite: this.limitePorPagina(),
    };
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
