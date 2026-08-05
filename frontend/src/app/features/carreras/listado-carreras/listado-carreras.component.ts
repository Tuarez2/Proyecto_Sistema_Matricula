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

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { FacultadesService } from '../../facultades/services/facultades.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import type { Facultad } from '../../facultades/models/facultad.model';
import type { Carrera, FiltrosCarreras } from '../models/carrera.model';
import { CarrerasService } from '../services/carreras.service';

interface ControlesFiltrosCarreras {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  facultad_id: FormControl<string>;
  activo: FormControl<string>;
}

const LIMITE_POR_PAGINA = 10;

@Component({
  selector: 'app-listado-carreras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginationComponent],
  templateUrl: './listado-carreras.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoCarrerasComponent implements OnInit {
  private readonly servicio = inject(CarrerasService);
  private readonly facultadesServicio = inject(FacultadesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoCarreras = signal<Carrera[]>([]);
  private readonly estadoFacultades = signal<Facultad[]>([]);
  private readonly estadoFiltrosAplicados = signal<FiltrosCarreras>({});
  private readonly estadoCargandoCarreras = signal(false);
  private readonly estadoCargandoFacultades = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoCarreraProcesando = signal<number | null>(null);

  readonly carreras = this.estadoCarreras.asReadonly();
  readonly facultades = this.estadoFacultades.asReadonly();
  readonly cargandoCarreras = this.estadoCargandoCarreras.asReadonly();
  readonly cargandoFacultades = this.estadoCargandoFacultades.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly carreraProcesando = this.estadoCarreraProcesando.asReadonly();
  readonly cargando = computed(
    () => this.cargandoCarreras() || this.cargandoFacultades(),
  );
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly carrerasFiltradas = computed(() =>
    this.aplicarFiltros(this.carreras(), this.estadoFiltrosAplicados()),
  );
  readonly totalCarreras = computed(() => this.carrerasFiltradas().length);
  readonly totalPaginas = computed(() =>
    Math.max(Math.ceil(this.totalCarreras() / LIMITE_POR_PAGINA), 1),
  );
  readonly carrerasPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * LIMITE_POR_PAGINA;
    return this.carrerasFiltradas().slice(inicio, inicio + LIMITE_POR_PAGINA);
  });

  readonly filtros = new FormGroup<ControlesFiltrosCarreras>({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
    facultad_id: new FormControl('', { nonNullable: true }),
    activo: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarCarreras();
    this.cargarFacultades();
  }

  cargarCarreras(): void {
    if (this.cargandoCarreras()) {
      return;
    }

    this.estadoCargandoCarreras.set(true);
    this.estadoMensajeError.set(null);
    this.servicio.listarCarreras()
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargandoCarreras.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCarreras.set(respuesta.data ?? []);
          this.ajustarPaginaActual();
        },
        error: (error: unknown) => {
          this.estadoCarreras.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cargarFacultades(): void {
    if (this.cargandoFacultades()) {
      return;
    }

    this.estadoCargandoFacultades.set(true);
    this.facultadesServicio.listarFacultades({ limite: 100 })
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargandoFacultades.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoFacultades.set(respuesta.data ?? []);
        },
        error: () => {
          this.estadoFacultades.set([]);
          this.estadoMensajeError.set(
            'No fue posible cargar el catálogo de facultades.',
          );
        },
      });
  }

  buscarCarreras(): void {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      this.estadoMensajeError.set('Revise los filtros ingresados.');
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoPaginaActual.set(1);
    this.estadoFiltrosAplicados.set(this.obtenerFiltrosActuales());
  }

  limpiarFiltros(): void {
    this.filtros.reset({
      codigo: '',
      nombre: '',
      facultad_id: '',
      activo: '',
    });
    this.estadoMensajeError.set(null);
    this.estadoPaginaActual.set(1);
    this.estadoFiltrosAplicados.set({});
  }

  cambiarPagina(pagina: number): void {
    if (pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
  }

  inactivarCarrera(carrera: Carrera): void {
    if (
      !this.esAdministrador() ||
      !carrera.activo ||
      this.carreraProcesando() !== null
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Desea inactivar la carrera ${carrera.nombre}?`,
    );

    if (!confirmado) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoCarreraProcesando.set(carrera.id);
    this.servicio.inactivarCarrera(carrera.id)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCarreraProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Carrera inactivada correctamente.',
          );
          this.cargarCarreras();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerEtiquetaEstado(carrera: Carrera): string {
    return carrera.activo ? 'Activa' : 'Inactiva';
  }

  obtenerNombreFacultad(carrera: Carrera): string {
    const facultad = carrera.facultad
      ?? this.facultades().find((item) => item.id === carrera.facultad_id)
      ?? null;

    if (!facultad) {
      return 'Sin facultad';
    }

    const codigo = facultad.codigo ? `${facultad.codigo} - ` : '';
    const estado = facultad.activo === false ? ' (inactiva)' : '';
    return `${codigo}${facultad.nombre}${estado}`;
  }

  private obtenerFiltrosActuales(): FiltrosCarreras {
    const valores = this.filtros.getRawValue();
    const idFacultad = Number(valores.facultad_id);

    return {
      codigo: valores.codigo.trim() || undefined,
      nombre: valores.nombre.trim() || undefined,
      facultad_id:
        Number.isInteger(idFacultad) && idFacultad > 0
          ? idFacultad
          : undefined,
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

  private aplicarFiltros(
    carreras: Carrera[],
    filtros: FiltrosCarreras,
  ): Carrera[] {
    return carreras.filter((carrera) => {
      const coincideCodigo = !filtros.codigo
        || carrera.codigo.toLowerCase().includes(filtros.codigo.toLowerCase());
      const coincideNombre = !filtros.nombre
        || carrera.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
      const coincideFacultad = filtros.facultad_id === undefined
        || carrera.facultad_id === filtros.facultad_id;
      const coincideEstado = filtros.activo === undefined
        || carrera.activo === filtros.activo;

      return (
        coincideCodigo &&
        coincideNombre &&
        coincideFacultad &&
        coincideEstado
      );
    });
  }

  private ajustarPaginaActual(): void {
    if (this.paginaActual() > this.totalPaginas()) {
      this.estadoPaginaActual.set(this.totalPaginas());
    }
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar carreras.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar carreras.';
    }

    if (error.status === 404) {
      return 'La carrera solicitada no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar carreras.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar carreras.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'FACULTAD_NOT_FOUND') {
      return 'La facultad especificada no existe.';
    }

    return cuerpo?.message || 'Revise los datos ingresados.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'UNIQUE_CONSTRAINT_ERROR') {
      return 'El código de carrera ya está registrado.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos de la carrera.';
  }
}
