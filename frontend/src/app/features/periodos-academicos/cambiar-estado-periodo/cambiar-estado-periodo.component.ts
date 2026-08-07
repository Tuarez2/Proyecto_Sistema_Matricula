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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import {
  ESTADOS_PERIODO_ACADEMICO,
  TRANSICIONES_PERIODO_ACADEMICO,
  type CambiarEstadoPeriodoAcademicoSolicitud,
  type EstadoPeriodoAcademico,
  type PeriodoAcademico,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';

@Component({
  selector: 'app-cambiar-estado-periodo',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FechaPipe,
  ],
  templateUrl: './cambiar-estado-periodo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiarEstadoPeriodoComponent implements OnInit {
  private readonly rutaActivada = inject(ActivatedRoute);
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly periodosAcademicosService = inject(PeriodosAcademicosService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoPeriodo = signal<PeriodoAcademico | null>(null);
  private readonly estadoCargandoPeriodo = signal(false);
  private readonly estadoActualizandoEstado = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeAviso = signal<string | null>(null);
  private idPeriodo: number | null = null;

  readonly ESTADOS_PERIODO_ACADEMICO = ESTADOS_PERIODO_ACADEMICO;
  readonly periodo = this.estadoPeriodo.asReadonly();
  readonly cargandoPeriodo = this.estadoCargandoPeriodo.asReadonly();
  readonly actualizandoEstado = this.estadoActualizandoEstado.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeAviso = this.estadoMensajeAviso.asReadonly();
  readonly estadoActual = computed(
    () => this.periodo()?.estado ?? null,
  );
  readonly estadosPermitidos = computed<readonly EstadoPeriodoAcademico[]>(
    () => {
      const estado = this.estadoActual();

      if (!estado) {
        return [];
      }

      return TRANSICIONES_PERIODO_ACADEMICO[estado];
    },
  );
  readonly tieneTransicionesDisponibles = computed(
    () => this.estadosPermitidos().length > 0,
  );
  readonly puedeGuardar = computed(
    () =>
      !this.cargandoPeriodo() &&
      !this.actualizandoEstado() &&
      this.periodo() !== null &&
      this.tieneTransicionesDisponibles(),
  );
  readonly formularioEstado = this.constructorFormulario.nonNullable.group({
    nuevoEstado: this.constructorFormulario.nonNullable.control<
      EstadoPeriodoAcademico | ''
    >('', [Validators.required]),
  });

  ngOnInit(): void {
    const idPeriodo = this.obtenerIdPeriodo();

    if (idPeriodo === null) {
      this.estadoMensajeError.set(
        'El identificador del periodo académico no es válido.',
      );
      return;
    }

    this.idPeriodo = idPeriodo;
    this.cargarPeriodo();
  }

  guardarEstado(): void {
    if (this.actualizandoEstado()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);

    const periodo = this.periodo();

    if (!periodo || this.idPeriodo === null) {
      this.estadoMensajeError.set(
        'No fue posible cambiar el estado del periodo académico.',
      );
      return;
    }

    if (!this.tieneTransicionesDisponibles()) {
      this.estadoMensajeAviso.set(
        'El periodo académico no tiene transiciones disponibles.',
      );
      return;
    }

    if (this.formularioEstado.invalid) {
      this.formularioEstado.markAllAsTouched();
      return;
    }

    const nuevoEstado = this.formularioEstado.controls.nuevoEstado.value;

    if (!this.esEstadoPeriodoAcademico(nuevoEstado)) {
      this.estadoMensajeError.set('Seleccione un estado válido.');
      return;
    }

    if (nuevoEstado === periodo.estado) {
      this.estadoMensajeAviso.set(
        'El periodo académico ya tiene el estado seleccionado.',
      );
      return;
    }

    if (!this.estadosPermitidos().includes(nuevoEstado)) {
      this.estadoMensajeError.set(
        'La transición de estado seleccionada no está permitida.',
      );
      return;
    }

    const solicitud: CambiarEstadoPeriodoAcademicoSolicitud = {
      estado: nuevoEstado,
    };

    this.estadoActualizandoEstado.set(true);
    this.periodosAcademicosService.cambiarEstadoPeriodo(this.idPeriodo, solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoActualizandoEstado.set(false)),
      )
      .subscribe({
        next: () => {
          this.estadoMensajeError.set(null);
          this.estadoMensajeAviso.set(null);
          void this.enrutador.navigateByUrl('/periodos-academicos');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(
            this.obtenerMensajeErrorActualizacion(error),
          );
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

  obtenerDescripcionEfecto(): string | null {
    const nuevoEstado = this.formularioEstado.controls.nuevoEstado.value;

    if (nuevoEstado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA) {
      return 'El periodo quedará disponible para el proceso de matrícula.';
    }

    if (nuevoEstado === ESTADOS_PERIODO_ACADEMICO.EN_CURSO) {
      return 'El periodo pasará a ejecución académica.';
    }

    if (nuevoEstado === ESTADOS_PERIODO_ACADEMICO.CERRADO) {
      return 'El periodo quedará cerrado y no admitirá nuevas transiciones.';
    }

    return null;
  }

  private obtenerIdPeriodo(): number | null {
    const idParametro = this.rutaActivada.snapshot.paramMap.get('id');

    if (!idParametro || !/^[1-9]\d*$/.test(idParametro)) {
      return null;
    }

    const idPeriodo = Number(idParametro);

    if (!Number.isSafeInteger(idPeriodo) || idPeriodo <= 0) {
      return null;
    }

    return idPeriodo;
  }

  private cargarPeriodo(): void {
    if (this.cargandoPeriodo() || this.idPeriodo === null) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);
    this.estadoCargandoPeriodo.set(true);

    this.periodosAcademicosService.obtenerPeriodoPorId(this.idPeriodo)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoPeriodo.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const periodo = respuesta.data;

          if (!periodo) {
            this.estadoPeriodo.set(null);
            this.estadoMensajeError.set(
              'No fue posible consultar el periodo académico.',
            );
            return;
          }

          if (!this.esEstadoPeriodoAcademico(periodo.estado)) {
            this.estadoPeriodo.set(null);
            this.estadoMensajeError.set(
              'El estado actual del periodo académico no es válido.',
            );
            return;
          }

          this.estadoPeriodo.set(periodo);
          this.formularioEstado.reset({
            nuevoEstado: '',
          });

          if (periodo.estado === ESTADOS_PERIODO_ACADEMICO.CERRADO) {
            this.estadoMensajeAviso.set(
              'El periodo académico está cerrado y no tiene transiciones disponibles.',
            );
          }
        },
        error: (error: unknown) => {
          this.estadoPeriodo.set(null);
          this.estadoMensajeError.set(this.obtenerMensajeErrorCarga(error));
        },
      });
  }

  private esEstadoPeriodoAcademico(
    valor: string,
  ): valor is EstadoPeriodoAcademico {
    return Object.values(ESTADOS_PERIODO_ACADEMICO).some(
      (estado) => estado === valor,
    );
  }

  private obtenerMensajeErrorCarga(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el periodo académico.';
    }

    const codigo = this.obtenerCodigoError(error.error);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar el periodo académico.';
    }

    if (error.status === 404 || codigo === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El periodo académico solicitado no existe.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al consultar el periodo académico.';
    }

    return 'No fue posible consultar el periodo académico.';
  }

  private obtenerMensajeErrorActualizacion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cambiar el estado del periodo académico.';
    }

    const cuerpoError = error.error;
    const codigo = this.obtenerCodigoError(cuerpoError);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (codigo === 'UNKNOWN_FIELDS') {
      return 'La solicitud contiene campos no permitidos.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeBackend(cuerpoError) ??
        this.obtenerPrimerDetalle(cuerpoError) ??
        'Revise el estado seleccionado.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para cambiar el estado de periodos académicos.';
    }

    if (error.status === 404 || codigo === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El periodo académico solicitado no existe.';
    }

    if (error.status === 409) {
      if (codigo === 'PERIODO_TRANSICION_INVALIDA') {
        const detalle = this.obtenerDetalleTransicion(cuerpoError);
        const mensajeBase = 'La transición de estado seleccionada no está permitida.';

        if (!detalle) {
          return mensajeBase;
        }

        return `${mensajeBase} No se permite cambiar de «${this.obtenerEtiquetaEstado(detalle.estadoActual)}» a «${this.obtenerEtiquetaEstado(detalle.estadoSiguiente)}».`;
      }

      if (codigo === 'PERIODO_OPERATIVO_DUPLICATED') {
        return 'Ya existe un periodo académico en matrícula abierta o en curso.';
      }

      return 'No fue posible cambiar el estado porque existe un conflicto.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al cambiar el estado del periodo académico.';
    }

    return 'No fue posible cambiar el estado del periodo académico.';
  }

  private obtenerDetalleTransicion(
    cuerpoError: unknown,
  ): { estadoActual: EstadoPeriodoAcademico; estadoSiguiente: EstadoPeriodoAcademico } | null {
    if (!this.esRegistro(cuerpoError) || !this.esRegistro(cuerpoError['details'])) {
      return null;
    }

    const estadoActual = cuerpoError['details']['estadoActual'];
    const estadoSiguiente = cuerpoError['details']['estadoSiguiente'];

    if (
      typeof estadoActual !== 'string' ||
      typeof estadoSiguiente !== 'string' ||
      !this.esEstadoPeriodoAcademico(estadoActual) ||
      !this.esEstadoPeriodoAcademico(estadoSiguiente)
    ) {
      return null;
    }

    return {
      estadoActual,
      estadoSiguiente,
    };
  }

  private obtenerMensajeBackend(cuerpoError: unknown): string | null {
    const mensaje = this.obtenerCadena(cuerpoError, 'message');

    if (!mensaje || !this.esMensajeSeguro(mensaje)) {
      return null;
    }

    return mensaje;
  }

  private obtenerPrimerDetalle(cuerpoError: unknown): string | null {
    if (!this.esRegistro(cuerpoError)) {
      return null;
    }

    const detalles = cuerpoError['details'];

    if (!Array.isArray(detalles)) {
      return null;
    }

    const primerDetalle = detalles.find(
      (detalle): detalle is string => typeof detalle === 'string',
    );

    if (!primerDetalle || !this.esMensajeSeguro(primerDetalle)) {
      return null;
    }

    return primerDetalle;
  }

  private obtenerCodigoError(cuerpoError: unknown): string | null {
    return this.obtenerCadena(cuerpoError, 'code');
  }

  private obtenerCadena(valor: unknown, propiedad: string): string | null {
    if (!this.esRegistro(valor)) {
      return null;
    }

    const dato = valor[propiedad];

    return typeof dato === 'string' ? dato : null;
  }

  private esMensajeSeguro(mensaje: string): boolean {
    const mensajeNormalizado = mensaje.toLowerCase();

    return !mensajeNormalizado.includes('token') &&
      !mensajeNormalizado.includes('stack') &&
      !mensajeNormalizado.includes('trace') &&
      !mensajeNormalizado.includes('servidor interno') &&
      !mensajeNormalizado.includes('configuración') &&
      !mensajeNormalizado.includes('configuracion') &&
      !mensajeNormalizado.includes('secret') &&
      !mensajeNormalizado.includes('consulta interna');
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
