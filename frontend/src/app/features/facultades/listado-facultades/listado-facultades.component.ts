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
import { Router, RouterLink } from '@angular/router';
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
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import {
  BarraAccionesContextualesComponent,
  esElementoInteractivo,
  type AccionContextual,
} from '../../../shared/components/barra-acciones-contextuales/barra-acciones-contextuales.component';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginationComponent, ConfirmModalComponent, BarraAccionesContextualesComponent, FechaPipe],
  templateUrl: './listado-facultades.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoFacultadesComponent implements OnInit {
  private readonly servicio = inject(FacultadesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly estadoFacultades = signal<Facultad[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoLimitePorPagina = signal(LIMITE_POR_PAGINA);
  private readonly estadoTotalFacultades = signal(0);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoFacultadProcesando = signal<number | null>(null);
  private readonly estadoFacultadSeleccionada = signal<Facultad | null>(null);
  private readonly estadoFilaSeleccionada = signal<Facultad | null>(null);
  private readonly estadoDialogoAbierto = signal(false);
  private readonly estadoDialogoTitulo = signal('');
  private readonly estadoDialogoMensaje = signal('');
  private readonly estadoDialogoPeligroso = signal(false);
  private readonly estadoDialogoProcesando = signal(false);
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
  readonly dialogoAbierto = this.estadoDialogoAbierto.asReadonly();
  readonly dialogoTitulo = this.estadoDialogoTitulo.asReadonly();
  readonly dialogoMensaje = this.estadoDialogoMensaje.asReadonly();
  readonly dialogoPeligroso = this.estadoDialogoPeligroso.asReadonly();
  readonly dialogoProcesando = this.estadoDialogoProcesando.asReadonly();
  readonly filaSeleccionada = this.estadoFilaSeleccionada.asReadonly();
  readonly accionesContextuales = computed<AccionContextual[]>(() => {
    const facultad = this.estadoFilaSeleccionada();

    if (!facultad) {
      return [];
    }

    const acciones: AccionContextual[] = [
      { id: 'ver', etiqueta: 'Ver' },
    ];

    if (this.esAdministrador()) {
      acciones.push({ id: 'editar', etiqueta: 'Editar' });
      acciones.push({
        id: 'cambiar-estado',
        etiqueta: facultad.activo ? 'Desactivar' : 'Activar',
        variante: facultad.activo ? 'danger' : 'neutral',
      });
    }

    return acciones;
  });
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
    this.estadoFilaSeleccionada.set(null);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  seleccionarFila(evento: Event, facultad: Facultad): void {
    if (esElementoInteractivo(evento.target)) {
      return;
    }

    this.alternarSeleccion(facultad);
  }

  seleccionarFilaTeclado(evento: KeyboardEvent, facultad: Facultad): void {
    if (esElementoInteractivo(evento.target)) {
      return;
    }

    if (evento.key !== 'Enter' && evento.key !== ' ') {
      return;
    }

    evento.preventDefault();
    this.alternarSeleccion(facultad);
  }

  alternarSeleccion(facultad: Facultad): void {
    this.estadoFilaSeleccionada.set(
      this.estadoFilaSeleccionada()?.id === facultad.id ? null : facultad,
    );
  }

  limpiarSeleccion(): void {
    this.estadoFilaSeleccionada.set(null);
  }

  ejecutarAccionContextual(accionId: string): void {
    const facultad = this.estadoFilaSeleccionada();

    if (!facultad) {
      return;
    }

    switch (accionId) {
      case 'ver':
        this.router.navigate(['/facultades', facultad.id]);
        break;
      case 'editar':
        this.router.navigate(['/facultades/editar', facultad.id]);
        break;
      case 'cambiar-estado':
        this.cambiarEstado(facultad);
        break;
    }
  }

  cambiarEstado(facultad: Facultad): void {
    if (!this.esAdministrador() || this.facultadProcesando() !== null) {
      return;
    }

    const activar = !facultad.activo;
    const accion = activar ? 'activar' : 'desactivar';

    this.estadoFacultadSeleccionada.set(facultad);
    this.estadoDialogoTitulo.set(
      activar ? 'Activar facultad' : 'Desactivar facultad',
    );
    this.estadoDialogoMensaje.set(
      `¿Desea ${accion} la facultad ${facultad.nombre}?`,
    );
    this.estadoDialogoPeligroso.set(!activar);
    this.estadoDialogoAbierto.set(true);
  }

  confirmarCambioEstado(): void {
    const facultad = this.estadoFacultadSeleccionada();

    if (!facultad) {
      return;
    }

    const activar = !facultad.activo;

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoFacultadProcesando.set(facultad.id);
    this.estadoDialogoProcesando.set(true);
    this.servicio.cambiarEstadoFacultad(facultad.id, { activo: activar })
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => {
          this.estadoFacultadProcesando.set(null);
          this.estadoDialogoProcesando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          if (respuesta.data) {
            this.reemplazarFacultad(respuesta.data);
          }
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Estado de facultad actualizado correctamente.',
          );
          this.estadoDialogoAbierto.set(false);
          this.estadoFilaSeleccionada.set(null);
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
    this.estadoFacultadSeleccionada.set(null);
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
    this.estadoFilaSeleccionada.set(null);
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