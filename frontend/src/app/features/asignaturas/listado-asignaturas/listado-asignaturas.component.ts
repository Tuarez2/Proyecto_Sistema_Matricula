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
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import type {
  Asignatura,
  FiltrosAsignaturas,
} from '../models/asignatura.model';
import { AsignaturasService } from '../services/asignaturas.service';

interface ControlesFiltrosAsignaturas {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  activo: FormControl<string>;
}

const LIMITE_POR_PAGINA = 10;

@Component({
  selector: 'app-listado-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PaginationComponent,
  ],
  templateUrl: './listado-asignaturas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoAsignaturasComponent implements OnInit {
  private readonly servicio = inject(AsignaturasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoAsignaturas = signal<Asignatura[]>([]);
  private readonly estadoFiltrosAplicados = signal<FiltrosAsignaturas>({});
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoAsignaturaProcesando = signal<number | null>(null);

  readonly asignaturas = this.estadoAsignaturas.asReadonly();
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
  readonly asignaturasFiltradas = computed(() =>
    this.aplicarFiltros(this.asignaturas(), this.estadoFiltrosAplicados()),
  );
  readonly totalAsignaturas = computed(
    () => this.asignaturasFiltradas().length,
  );
  readonly totalPaginas = computed(() =>
    Math.max(Math.ceil(this.totalAsignaturas() / LIMITE_POR_PAGINA), 1),
  );
  readonly asignaturasPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * LIMITE_POR_PAGINA;

    return this.asignaturasFiltradas().slice(
      inicio,
      inicio + LIMITE_POR_PAGINA,
    );
  });

  readonly filtros = new FormGroup<ControlesFiltrosAsignaturas>({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
    activo: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarAsignaturas();
  }

  cargarAsignaturas(): void {
    if (this.cargando()) {
      return;
    }

    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.servicio
      .listarAsignaturas()
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoAsignaturas.set(respuesta.data ?? []);
          this.ajustarPaginaActual();
        },
        error: (error: unknown) => {
          this.estadoAsignaturas.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  buscarAsignaturas(): void {
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
    this.filtros.reset({ codigo: '', nombre: '', activo: '' });
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
          this.cargarAsignaturas();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerEtiquetaEstado(asignatura: Asignatura): string {
    return asignatura.activo ? 'Activa' : 'Inactiva';
  }

  private obtenerFiltrosActuales(): FiltrosAsignaturas {
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

  private aplicarFiltros(
    asignaturas: Asignatura[],
    filtros: FiltrosAsignaturas,
  ): Asignatura[] {
    return asignaturas.filter((asignatura) => {
      const coincideCodigo = !filtros.codigo ||
        asignatura.codigo.toLowerCase().includes(filtros.codigo.toLowerCase());
      const coincideNombre = !filtros.nombre ||
        asignatura.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
      const coincideEstado = filtros.activo === undefined ||
        asignatura.activo === filtros.activo;

      return coincideCodigo && coincideNombre && coincideEstado;
    });
  }

  private ajustarPaginaActual(): void {
    if (this.paginaActual() > this.totalPaginas()) {
      this.estadoPaginaActual.set(this.totalPaginas());
    }
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