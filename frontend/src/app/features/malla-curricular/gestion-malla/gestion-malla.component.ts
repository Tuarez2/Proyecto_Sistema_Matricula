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
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import type { Asignatura } from '../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../asignaturas/services/asignaturas.service';
import type { Carrera } from '../../carreras/models/carrera.model';
import { CarrerasService } from '../../carreras/services/carreras.service';
import type {
  SolicitudActualizarRelacion,
  SolicitudAgregarAsignatura,
} from '../models/malla-curricular.model';
import { MallaCurricularService } from '../services/malla-curricular.service';

interface RelacionEnEdicion {
  carreraId: number;
  asignaturaId: number;
}

type ContextoError = 'consultar' | 'asignar' | 'editar' | 'quitar';

const LIMITE_POR_PAGINA = 100;

@Component({
  selector: 'app-gestion-malla',
  standalone: true,
  imports: [ReactiveFormsModule, PaginationComponent],
  templateUrl: './gestion-malla.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionMallaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(MallaCurricularService);
  private readonly carrerasServicio = inject(CarrerasService);
  private readonly asignaturasServicio = inject(AsignaturasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);

  private readonly estadoCarreras = signal<Carrera[]>([]);
  private readonly estadoCargandoCarreras = signal(false);
  private readonly estadoCatalogoAsignaturas = signal<Asignatura[]>([]);
  private readonly estadoCargandoCatalogo = signal(false);
  private readonly estadoCarreraSeleccionada = signal<number | null>(null);
  private readonly estadoCarreraMalla = signal<Carrera | null>(null);
  private readonly estadoAsignaturasCarrera = signal<Asignatura[]>([]);
  private readonly estadoCargandoMalla = signal(false);
  private readonly estadoPaginaMalla = signal(1);
  private readonly estadoTotalMalla = signal(0);
  private readonly estadoTotalPaginasMalla = signal(1);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoProcesando = signal<string | null>(null);
  private readonly estadoRelacionEnEdicion =
    signal<RelacionEnEdicion | null>(null);

  readonly carreras = this.estadoCarreras.asReadonly();
  readonly catalogos = this.estadoCatalogoAsignaturas.asReadonly();
  readonly cargandoCarreras = this.estadoCargandoCarreras.asReadonly();
  readonly carreraSeleccionada = this.estadoCarreraSeleccionada.asReadonly();
  readonly carreraMalla = this.estadoCarreraMalla.asReadonly();
  readonly asignaturasCarrera = this.estadoAsignaturasCarrera.asReadonly();
  readonly cargandoMalla = this.estadoCargandoMalla.asReadonly();
  readonly paginaMalla = this.estadoPaginaMalla.asReadonly();
  readonly totalMalla = this.estadoTotalMalla.asReadonly();
  readonly totalPaginasMalla = this.estadoTotalPaginasMalla.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly procesando = this.estadoProcesando.asReadonly();
  readonly relacionEnEdicion = this.estadoRelacionEnEdicion.asReadonly();

  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()?.rol?.codigo ===
      CODIGOS_ROL.ADMIN,
  );

  readonly asignaturasDisponibles = computed(() => {
    if (!this.estadoCarreraSeleccionada()) {
      return [];
    }

    const asignadas = new Set(
      this.estadoAsignaturasCarrera().map((asignatura) => asignatura.id),
    );

    return this.estadoCatalogoAsignaturas().filter(
      (asignatura) => !asignadas.has(asignatura.id),
    );
  });

  readonly asignaturasParaEdicion = computed(() => {
    const relacion = this.estadoRelacionEnEdicion();
    if (!relacion) {
      return [];
    }

    const asignadas = new Set(
      this.estadoAsignaturasCarrera()
        .filter((asignatura) => asignatura.id !== relacion.asignaturaId)
        .map((asignatura) => asignatura.id),
    );

    return this.estadoCatalogoAsignaturas().filter(
      (asignatura) => !asignadas.has(asignatura.id),
    );
  });

  readonly formularioAsignar = this.fb.nonNullable.group({
    carreraId: ['', Validators.required],
    asignaturaId: ['', Validators.required],
  });

  readonly formularioEditar = this.fb.nonNullable.group({
    asignaturaId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargarCarreras();
    this.cargarCatalogoAsignaturas();
  }

  cargarCarreras(): void {
    if (this.estadoCargandoCarreras()) {
      return;
    }

    this.estadoCargandoCarreras.set(true);
    this.carrerasServicio.listarCarreras({ activo: true, limite: 100 })
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargandoCarreras.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCarreras.set(
            (respuesta.data ?? []).filter((carrera) => carrera.activo),
          );
        },
        error: () => {
          this.estadoCarreras.set([]);
          this.estadoMensajeError.set(
            'No fue posible cargar el catálogo de carreras.',
          );
        },
      });
  }

  cargarCatalogoAsignaturas(): void {
    if (this.estadoCargandoCatalogo()) {
      return;
    }

    this.estadoCargandoCatalogo.set(true);
    this.asignaturasServicio.listarAsignaturas({ activo: true, limite: 100 })
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargandoCatalogo.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCatalogoAsignaturas.set(
            (respuesta.data ?? []).filter((asignatura) => asignatura.activo),
          );
        },
        error: () => {
          this.estadoCatalogoAsignaturas.set([]);
          this.estadoMensajeError.set(
            'No fue posible cargar el catálogo de asignaturas.',
          );
        },
      });
  }

  consultarMalla(): void {
    const idCarrera = Number(this.formularioAsignar.controls.carreraId.value);

    if (!Number.isInteger(idCarrera) || idCarrera < 1) {
      return;
    }

    this.formularioAsignar.controls.asignaturaId.setValue('');
    this.estadoRelacionEnEdicion.set(null);
    this.estadoPaginaMalla.set(1);
    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoCarreraSeleccionada.set(idCarrera);
    this.cargarAsignaturasCarrera(idCarrera, 1);
  }

  cambiarPagina(pagina: number): void {
    const idCarrera = this.estadoCarreraSeleccionada();

    if (!idCarrera || pagina === this.estadoPaginaMalla()) {
      return;
    }

    this.estadoPaginaMalla.set(pagina);
    this.estadoMensajeError.set(null);
    this.cargarAsignaturasCarrera(idCarrera, pagina);
  }

  asignar(): void {
    if (!this.esAdministrador() || this.estadoProcesando()) {
      return;
    }

    if (this.formularioAsignar.invalid) {
      this.formularioAsignar.markAllAsTouched();
      this.estadoMensajeError.set(
        'Seleccione la carrera y la asignatura a asociar.',
      );
      return;
    }

    const valores = this.formularioAsignar.getRawValue();
    const solicitud: SolicitudAgregarAsignatura = {
      carrera_id: Number(valores.carreraId),
      asignatura_id: Number(valores.asignaturaId),
    };

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoProcesando.set('asignar');
    this.servicio.asignarAsignatura(solicitud)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.formularioAsignar.controls.asignaturaId.setValue('');
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Asignatura asociada correctamente.',
          );
          this.recargarMallaActual();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(
            this.obtenerMensajeError(error, 'asignar'),
          );
        },
      });
  }

  iniciarEdicion(asignatura: Asignatura): void {
    const idCarrera = this.estadoCarreraSeleccionada();

    if (!this.esAdministrador() || this.estadoProcesando() || !idCarrera) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoRelacionEnEdicion.set({
      carreraId: idCarrera,
      asignaturaId: asignatura.id,
    });
    this.formularioEditar.controls.asignaturaId.setValue(String(asignatura.id));
  }

  guardarEdicion(): void {
    const relacion = this.estadoRelacionEnEdicion();

    if (!this.esAdministrador() || this.estadoProcesando() || !relacion) {
      return;
    }

    if (this.formularioEditar.invalid) {
      this.formularioEditar.markAllAsTouched();
      this.estadoMensajeError.set('Seleccione la asignatura de reemplazo.');
      return;
    }

    const nuevaAsignaturaId = Number(
      this.formularioEditar.controls.asignaturaId.value,
    );

    if (nuevaAsignaturaId === relacion.asignaturaId) {
      this.cancelarEdicion();
      return;
    }

    const solicitud: SolicitudActualizarRelacion = {
      asignatura_id: nuevaAsignaturaId,
    };
    const idAsignacion = this.servicio.construirIdAsignacion(
      relacion.carreraId,
      relacion.asignaturaId,
    );

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoProcesando.set('editar');
    this.servicio.actualizarRelacion(idAsignacion, solicitud)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoRelacionEnEdicion.set(null);
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Relación actualizada correctamente.',
          );
          this.recargarMallaActual();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(
            this.obtenerMensajeError(error, 'editar'),
          );
        },
      });
  }

  cancelarEdicion(): void {
    this.estadoRelacionEnEdicion.set(null);
  }

  quitarAsignatura(asignatura: Asignatura): void {
    const idCarrera = this.estadoCarreraSeleccionada();

    if (
      !this.esAdministrador()
      || this.estadoProcesando()
      || !idCarrera
    ) {
      return;
    }

    const nombreCarrera = this.estadoCarreraMalla()?.nombre ?? '';
    const confirmado = window.confirm(
      `¿Desea quitar la asignatura ${asignatura.nombre} de la carrera `
        + `${nombreCarrera}? Esta acción solo elimina la relación; no borra `
        + 'la asignatura del catálogo.',
    );

    if (!confirmado) {
      return;
    }

    const idAsignacion = this.servicio.construirIdAsignacion(
      idCarrera,
      asignatura.id,
    );

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoProcesando.set('quitar');
    this.servicio.quitarAsignatura(idAsignacion)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Asignatura quitada correctamente.',
          );
          this.recargarMallaActual();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(
            this.obtenerMensajeError(error, 'quitar'),
          );
        },
      });
  }

  estaEditando(asignatura: Asignatura): boolean {
    const relacion = this.estadoRelacionEnEdicion();

    return relacion?.asignaturaId === asignatura.id;
  }

  columnasTabla(): number {
    return this.esAdministrador() ? 5 : 4;
  }

  private recargarMallaActual(): void {
    const idCarrera = this.estadoCarreraSeleccionada();

    if (!idCarrera) {
      return;
    }

    this.cargarAsignaturasCarrera(idCarrera, this.estadoPaginaMalla());
  }

  private cargarAsignaturasCarrera(idCarrera: number, pagina: number): void {
    this.estadoCargandoMalla.set(true);
    this.servicio.consultarAsignaturasCarrera(
      idCarrera,
      pagina,
      LIMITE_POR_PAGINA,
    )
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargandoMalla.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCarreraMalla.set(respuesta.carrera);
          this.estadoAsignaturasCarrera.set(respuesta.data ?? []);
          this.estadoTotalMalla.set(respuesta.total);
          this.estadoTotalPaginasMalla.set(respuesta.totalPages);
          this.estadoPaginaMalla.set(respuesta.page);
        },
        error: (error: unknown) => {
          this.estadoAsignaturasCarrera.set([]);
          this.estadoTotalMalla.set(0);
          this.estadoTotalPaginasMalla.set(1);
          this.estadoMensajeError.set(
            this.obtenerMensajeError(error, 'consultar'),
          );
        },
      });
  }

  private obtenerMensajeError(
    error: unknown,
    contexto: ContextoError,
  ): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible gestionar la malla curricular.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar la malla curricular.';
    }

    if (error.status === 404) {
      if (contexto === 'consultar') {
        return 'La carrera solicitada no existe.';
      }

      return 'La relación o el registro solicitado no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar la malla curricular.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible gestionar la malla curricular.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos ingresados.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'ASIGNACION_CURRICULAR_DUPLICATED') {
      return 'La asignatura ya está asociada a la carrera.';
    }

    if (cuerpo?.code === 'CARRERA_INACTIVA') {
      return 'La carrera no está activa.';
    }

    if (cuerpo?.code === 'ASIGNATURA_INACTIVA') {
      return 'La asignatura no está activa.';
    }

    return (
      cuerpo?.message
      || 'Existe un conflicto con los datos de la malla curricular.'
    );
  }
}
