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
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import type {
  Asignatura,
  FiltrosAsignaturas,
  RespuestaListadoAsignaturas,
} from '../models/asignatura.model';
import { AsignaturasService } from '../services/asignaturas.service';

interface ControlesFiltrosAsignaturas {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  creditos: FormControl<string>;
  nivel_academico: FormControl<string>;
  activo: FormControl<string>;
}

interface CambioConsulta {
  reiniciarPagina: boolean;
}

const LIMITE_POR_PAGINA = 10;
const DEBOUNCE_BUSQUEDA_MS = 350;

@Component({
  selector: 'app-listado-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PaginationComponent,
    FechaPipe,
  ],
  templateUrl: './listado-asignaturas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoAsignaturasComponent implements OnInit {
  private readonly servicio = inject(AsignaturasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoAsignaturas = signal<Asignatura[]>([]);
  private readonly estadoTotalAsignaturas = signal(0);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoFiltrosAplicados = signal<FiltrosAsignaturas>({});
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoAsignaturaProcesando = signal<number | null>(null);
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

  readonly asignaturas = this.estadoAsignaturas.asReadonly();
  readonly totalAsignaturas = this.estadoTotalAsignaturas.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly asignaturaProcesando = this.estadoAsignaturaProcesando.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()?.rol?.codigo ===
      CODIGOS_ROL.ADMIN,
  );
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );

  readonly filtros = new FormGroup<ControlesFiltrosAsignaturas>({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
    creditos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1), Validators.max(100)],
    }),
    nivel_academico: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1), Validators.max(100)],
    }),
    activo: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.configurarFiltrosDinamicos();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  buscarAsignaturas(): void {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      this.estadoMensajeError.set('Revise los filtros ingresados.');
      return;
    }

    this.estadoMensajeError.set(null);
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  impedirEnvio(evento: Event): void {
    evento.preventDefault();
  }

  limpiarFiltros(): void {
    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoFiltrosAplicados.set({});
    this.estadoPaginaActual.set(1);
    this.filtros.reset(
      {
        codigo: '',
        nombre: '',
        creditos: '',
        nivel_academico: '',
        activo: '',
      },
      { emitEvent: false },
    );
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.estadoMensajeError.set(null);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  inactivarAsignatura(asignatura: Asignatura): void {
    if (
      !this.esAdministrador() ||
      !asignatura.activo ||
      this.asignaturaProcesando() !== null
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Desea inactivar la asignatura ${asignatura.nombre}?`,
    );

    if (!confirmado) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoAsignaturaProcesando.set(asignatura.id);
    this.servicio
      .inactivarAsignatura(asignatura.id)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoAsignaturaProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Asignatura inactivada correctamente.',
          );
          this.consultaFiltros$.next({ reiniciarPagina: false });
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerEtiquetaEstado(asignatura: Asignatura): string {
    return asignatura.activo ? 'Activa' : 'Inactiva';
  }

  obtenerClaseEstado(asignatura: Asignatura): string {
    return asignatura.activo ? 'estado-badge--success' : 'estado-badge--neutral';
  }

  private configurarFiltrosDinamicos(): void {
    const textoDebounced = merge(
      this.filtros.controls.codigo.valueChanges,
      this.filtros.controls.nombre.valueChanges,
      this.filtros.controls.creditos.valueChanges,
      this.filtros.controls.nivel_academico.valueChanges,
    ).pipe(
      debounceTime(DEBOUNCE_BUSQUEDA_MS),
      map(() => true),
    );

    const selectoresInmediatos = this.filtros.controls.activo.valueChanges.pipe(
      map(() => true),
    );

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
          return this.consultarAsignaturas();
        }),
        takeUntilDestroyed(this.destruccion),
      )
      .subscribe();
  }

  private criteriosIgualesAplicados(): boolean {
    return (
      JSON.stringify(this.obtenerFiltrosActuales()) ===
      JSON.stringify(this.estadoFiltrosAplicados())
    );
  }

  private contarFiltros(filtros: FiltrosAsignaturas): number {
    return Object.values(filtros).filter((valor) => valor !== undefined).length;
  }

  private consultarAsignaturas(): Observable<RespuestaListadoAsignaturas> {
    const filtros = this.obtenerFiltrosActuales();
    this.estadoFiltrosAplicados.set(filtros);
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    return this.servicio
      .listarAsignaturas({
        ...filtros,
        pagina: this.estadoPaginaActual(),
        limite: LIMITE_POR_PAGINA,
      })
      .pipe(
        finalize(() => this.estadoCargando.set(false)),
        tap({
          next: (respuesta) => {
            this.estadoMensajeError.set(null);
            this.estadoAsignaturas.set(respuesta.data ?? []);
            this.estadoTotalAsignaturas.set(respuesta.total);
            this.estadoTotalPaginas.set(respuesta.totalPages);
            this.estadoPaginaActual.set(respuesta.page);
          },
        }),
        catchError((error: unknown) => {
          this.estadoAsignaturas.set([]);
          this.estadoTotalAsignaturas.set(0);
          this.estadoTotalPaginas.set(1);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
          return EMPTY;
        }),
      );
  }

  private obtenerFiltrosActuales(): FiltrosAsignaturas {
    const valores = this.filtros.getRawValue();

    return {
      codigo: valores.codigo.trim() || undefined,
      nombre: valores.nombre.trim() || undefined,
      creditos: this.obtenerEnteroPositivo(valores.creditos),
      nivel_academico: this.obtenerEnteroPositivo(valores.nivel_academico),
      activo: this.obtenerActivoFiltro(valores.activo),
    };
  }

  private obtenerEnteroPositivo(valor: string): number | undefined {
    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero < 1) {
      return undefined;
    }

    return numero;
  }

  private obtenerActivoFiltro(valor: string): boolean | undefined {
    if (valor === 'true') {
      return true;
    }

    if (valor === 'false') {
      return false;
    }

    return undefined;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar asignaturas.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar asignaturas.';
    }

    if (error.status === 404) {
      return 'La asignatura solicitada no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar asignaturas.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar asignaturas.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'EMPTY_UPDATE_PAYLOAD') {
      return 'Debe enviar al menos un campo para actualizar la asignatura.';
    }

    return 'Revise los datos de la asignatura.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'UNIQUE_CONSTRAINT_ERROR') {
      return 'El código de asignatura ya está registrado.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos de la asignatura.';
  }
}