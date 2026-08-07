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
  Facultad,
  FiltrosFacultades,
  RespuestaListadoFacultades,
} from '../models/facultad.model';
import { FacultadesService } from '../services/facultades.service';

interface CambioConsulta {
  reiniciarPagina: boolean;
}

interface ControlesFiltrosFacultades {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  activo: FormControl<string>;
}

const LIMITE_POR_PAGINA = 10;
const DEBOUNCE_BUSQUEDA_MS = 350;

@Component({
  selector: 'app-listado-facultades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginationComponent, FechaPipe],
  templateUrl: './listado-facultades.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoFacultadesComponent implements OnInit {
  private readonly servicio = inject(FacultadesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoFacultades = signal<Facultad[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoLimitePorPagina = signal(LIMITE_POR_PAGINA);
  private readonly estadoTotalFacultades = signal(0);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoFacultadProcesando = signal<number | null>(null);
  private readonly estadoFiltrosAplicados = signal<FiltrosFacultades>({});
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

  readonly facultades = this.estadoFacultades.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly limitePorPagina = this.estadoLimitePorPagina.asReadonly();
  readonly totalFacultades = this.estadoTotalFacultades.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly facultadProcesando = this.estadoFacultadProcesando.asReadonly();
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );

  readonly filtros = new FormGroup<ControlesFiltrosFacultades>({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    activo: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.configurarFiltrosDinamicos();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  buscarFacultades(): void {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      this.estadoMensajeError.set('Revise los filtros ingresados.');
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoFiltrosAplicados.set(this.obtenerFiltrosAplicables());
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  impedirEnvio(evento: Event): void {
    evento.preventDefault();
  }

  cargarFacultades(): void {
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  limpiarFiltros(): void {
    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoFiltrosAplicados.set({});
    this.estadoPaginaActual.set(1);
    this.filtros.reset({
      codigo: '',
      nombre: '',
      activo: '',
    }, { emitEvent: false });
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (this.cargando() || pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarEstado(facultad: Facultad): void {
    if (!this.esAdministrador() || this.facultadProcesando() !== null) {
      return;
    }

    const activar = !facultad.activo;
    const accion = activar ? 'activar' : 'desactivar';
    const confirmado = window.confirm(
      `¿Desea ${accion} la facultad ${facultad.nombre}?`,
    );

    if (!confirmado) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoFacultadProcesando.set(facultad.id);
    this.servicio.cambiarEstadoFacultad(facultad.id, { activo: activar })
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoFacultadProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          if (respuesta.data) {
            this.reemplazarFacultad(respuesta.data);
          }
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Estado de facultad actualizado correctamente.',
          );
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerEtiquetaEstado(facultad: Facultad): string {
    return facultad.activo ? 'Activa' : 'Inactiva';
  }

  obtenerClaseEstado(facultad: Facultad): string {
    return facultad.activo ? 'estado-badge--success' : 'estado-badge--neutral';
  }

  private configurarFiltrosDinamicos(): void {
    const textoDebounced = merge(
      this.filtros.controls.codigo.valueChanges,
      this.filtros.controls.nombre.valueChanges,
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
          return this.consultarFacultades();
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

  private contarFiltros(filtros: FiltrosFacultades): number {
    return Object.values(filtros).filter((valor) => valor !== undefined).length;
  }

  private consultarFacultades(): Observable<RespuestaListadoFacultades> {
    const filtros = this.obtenerFiltrosAplicables();
    this.estadoFiltrosAplicados.set(filtros);
    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoCargando.set(true);
    return this.servicio.listarFacultades({
      ...filtros,
      pagina: this.estadoPaginaActual(),
      limite: LIMITE_POR_PAGINA,
    }).pipe(
      finalize(() => this.estadoCargando.set(false)),
      tap({
        next: (respuesta) => {
          this.estadoMensajeError.set(null);
          this.estadoFacultades.set(respuesta.data ?? []);
          this.estadoPaginaActual.set(respuesta.page);
          this.estadoLimitePorPagina.set(respuesta.limit);
          this.estadoTotalFacultades.set(respuesta.total);
          this.estadoTotalPaginas.set(Math.max(respuesta.totalPages, 1));
        },
      }),
      catchError((error: unknown) => {
        this.estadoFacultades.set([]);
        this.estadoMensajeError.set(this.obtenerMensajeError(error));
        return EMPTY;
      }),
    );
  }

  private obtenerFiltrosAplicables(): FiltrosFacultades {
    const valores = this.filtros.getRawValue();

    return {
      codigo: valores.codigo.trim() || undefined,
      nombre: valores.nombre.trim() || undefined,
      activo: this.obtenerActivoFiltro(valores.activo),
    };
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

  private reemplazarFacultad(facultadActualizada: Facultad): void {
    this.estadoFacultades.update((facultades) =>
      facultades.map((facultad) =>
        facultad.id === facultadActualizada.id
          ? facultadActualizada
          : facultad,
      ),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar facultades.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar facultades.';
    }

    if (error.status === 404) {
      return 'La facultad solicitada no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar facultades.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar facultades.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos ingresados.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'FACULTAD_HAS_ACTIVE_CARRERAS') {
      return 'No puede desactivar una facultad con carreras activas.';
    }

    if (cuerpo?.code === 'FACULTAD_CODIGO_DUPLICATED') {
      return 'El código de facultad ya está registrado.';
    }

    if (cuerpo?.code === 'FACULTAD_NOMBRE_DUPLICATED') {
      return 'El nombre de facultad ya está registrado.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos de la facultad.';
  }
}