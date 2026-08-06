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

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  ESTADOS_MATRICULA,
  type EstadoMatricula,
  type FiltrosMatriculas,
  type Matricula,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';

interface ControlesFiltrosMatriculas {
  estudiante_id: FormControl<string>;
  curso_id: FormControl<string>;
  periodo_id: FormControl<string>;
  asignatura_id: FormControl<string>;
  carrera_id: FormControl<string>;
  estado: FormControl<EstadoMatricula | ''>;
  fecha_desde: FormControl<string>;
  fecha_hasta: FormControl<string>;
}

interface AccionEstadoMatricula {
  estado: EstadoMatricula;
  etiqueta: string;
}

const LIMITE_POR_PAGINA = 10;

@Component({
  selector: 'app-listar-matriculas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginationComponent],
  templateUrl: './listar-matriculas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarMatriculasComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoMatriculas = signal<Matricula[]>([]);
  private readonly estadoCargandoMatriculas = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoLimitePorPagina = signal(LIMITE_POR_PAGINA);
  private readonly estadoTotalMatriculas = signal(0);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoMatriculaProcesando = signal<number | null>(null);

  readonly ESTADOS_MATRICULA = ESTADOS_MATRICULA;
  readonly matriculas = this.estadoMatriculas.asReadonly();
  readonly cargandoMatriculas = this.estadoCargandoMatriculas.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly limitePorPagina = this.estadoLimitePorPagina.asReadonly();
  readonly totalMatriculas = this.estadoTotalMatriculas.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly matriculaProcesando = this.estadoMatriculaProcesando.asReadonly();
  readonly puedeGestionarMatriculas = computed(() => {
    const codigoRol = this.autenticacionService.usuarioActual()?.rol?.codigo;

    return (
      codigoRol === CODIGOS_ROL.ADMIN ||
      codigoRol === CODIGOS_ROL.GESTOR_MATRICULA
    );
  });

  readonly formularioFiltros = new FormGroup<ControlesFiltrosMatriculas>({
    estudiante_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    curso_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    periodo_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    asignatura_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    carrera_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    estado: new FormControl<EstadoMatricula | ''>('', { nonNullable: true }),
    fecha_desde: new FormControl('', { nonNullable: true }),
    fecha_hasta: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarMatriculas();
  }

  cargarMatriculas(): void {
    if (this.cargandoMatriculas()) {
      return;
    }

    if (!this.validarFiltros()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoCargandoMatriculas.set(true);
    this.matriculasService.listarMatriculas(this.obtenerFiltrosActuales())
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoMatriculas.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMatriculas.set(respuesta.data ?? []);
          this.estadoPaginaActual.set(respuesta.page);
          this.estadoLimitePorPagina.set(respuesta.limit);
          this.estadoTotalMatriculas.set(respuesta.total);
          this.estadoTotalPaginas.set(Math.max(respuesta.totalPages, 1));
        },
        error: (error: unknown) => {
          this.estadoMatriculas.set([]);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  buscarMatriculas(): void {
    if (this.cargandoMatriculas()) {
      return;
    }

    this.estadoPaginaActual.set(1);
    this.cargarMatriculas();
  }

  limpiarFiltros(): void {
    if (this.cargandoMatriculas()) {
      return;
    }

    this.formularioFiltros.reset({
      estudiante_id: '',
      curso_id: '',
      periodo_id: '',
      asignatura_id: '',
      carrera_id: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
    this.estadoPaginaActual.set(1);
    this.cargarMatriculas();
  }

  cambiarPagina(pagina: number): void {
    if (this.cargandoMatriculas() || pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.cargarMatriculas();
  }

  solicitarCambioEstado(
    matricula: Matricula,
    estadoSiguiente: EstadoMatricula,
  ): void {
    if (
      !this.puedeGestionarMatriculas() ||
      this.matriculaProcesando() !== null ||
      !this.estadoEsPermitidoPara(matricula, estadoSiguiente)
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Desea cambiar la matrícula ${matricula.id} a ${this.obtenerEtiquetaEstado(estadoSiguiente)}?`,
    );

    if (!confirmado) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoMatriculaProcesando.set(matricula.id);
    this.matriculasService.cambiarEstadoMatricula(matricula.id, {
      estado: estadoSiguiente,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoMatriculaProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          if (respuesta.data) {
            this.reemplazarMatricula(respuesta.data);
          }
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Estado de matrícula actualizado correctamente.',
          );
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerNombreEstudiante(matricula: Matricula): string {
    const estudiante = matricula.estudiante;

    if (!estudiante) {
      return `Estudiante ${matricula.estudiante_id}`;
    }

    return `${estudiante.nombres} ${estudiante.apellidos}`.trim();
  }

  obtenerDescripcionCurso(matricula: Matricula): string {
    const curso = matricula.curso;
    const asignatura = curso?.asignatura;

    if (!curso) {
      return `Curso ${matricula.curso_id}`;
    }

    if (!asignatura) {
      return `Curso ${curso.id} - Paralelo ${curso.paralelo}`;
    }

    return `${asignatura.codigo} - ${asignatura.nombre} (${curso.paralelo})`;
  }

  obtenerPeriodo(matricula: Matricula): string {
    return matricula.curso?.periodoAcademico?.nombre ?? 'Sin periodo';
  }

  obtenerDocente(matricula: Matricula): string {
    const docente = matricula.curso?.docente;

    if (!docente) {
      return 'Sin docente';
    }

    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  obtenerEtiquetaEstado(estado: EstadoMatricula): string {
    const etiquetas: Record<EstadoMatricula, string> = {
      [ESTADOS_MATRICULA.inscrita]: 'Inscrita',
      [ESTADOS_MATRICULA.aprobada]: 'Aprobada',
      [ESTADOS_MATRICULA.reprobada]: 'Reprobada',
      [ESTADOS_MATRICULA.retirada]: 'Retirada',
      [ESTADOS_MATRICULA.anulada]: 'Anulada',
    };

    return etiquetas[estado];
  }

  obtenerClaseEstado(estado: EstadoMatricula): string {
    const clases: Record<EstadoMatricula, string> = {
      [ESTADOS_MATRICULA.inscrita]: 'estado-badge--info',
      [ESTADOS_MATRICULA.aprobada]: 'estado-badge--success',
      [ESTADOS_MATRICULA.reprobada]: 'estado-badge--danger',
      [ESTADOS_MATRICULA.retirada]: 'estado-badge--warning',
      [ESTADOS_MATRICULA.anulada]: 'estado-badge--neutral',
    };

    return clases[estado];
  }

  obtenerAccionesEstado(matricula: Matricula): AccionEstadoMatricula[] {
    if (matricula.estado !== ESTADOS_MATRICULA.inscrita) {
      return [];
    }

    return [
      { estado: ESTADOS_MATRICULA.aprobada, etiqueta: 'Aprobar' },
      { estado: ESTADOS_MATRICULA.reprobada, etiqueta: 'Reprobar' },
      { estado: ESTADOS_MATRICULA.retirada, etiqueta: 'Retirar' },
      { estado: ESTADOS_MATRICULA.anulada, etiqueta: 'Anular' },
    ];
  }

  private estadoEsPermitidoPara(
    matricula: Matricula,
    estadoSiguiente: EstadoMatricula,
  ): boolean {
    return this.obtenerAccionesEstado(matricula)
      .some((accion) => accion.estado === estadoSiguiente);
  }

  private obtenerFiltrosActuales(): FiltrosMatriculas {
    const valores = this.formularioFiltros.getRawValue();

    return {
      estudiante_id: this.obtenerEnteroPositivo(valores.estudiante_id),
      curso_id: this.obtenerEnteroPositivo(valores.curso_id),
      periodo_id: this.obtenerEnteroPositivo(valores.periodo_id),
      asignatura_id: this.obtenerEnteroPositivo(valores.asignatura_id),
      carrera_id: this.obtenerEnteroPositivo(valores.carrera_id),
      estado: valores.estado || undefined,
      fecha_desde: valores.fecha_desde || undefined,
      fecha_hasta: valores.fecha_hasta || undefined,
      page: this.paginaActual(),
      limit: this.limitePorPagina(),
    };
  }

  private obtenerEnteroPositivo(valor: string): number | undefined {
    const valorNumerico = Number(valor);

    if (!Number.isInteger(valorNumerico) || valorNumerico < 1) {
      return undefined;
    }

    return valorNumerico;
  }

  private validarFiltros(): boolean {
    const valores = this.formularioFiltros.getRawValue();
    const hayRangoInvalido =
      valores.fecha_desde &&
      valores.fecha_hasta &&
      valores.fecha_desde > valores.fecha_hasta;

    if (this.formularioFiltros.invalid || hayRangoInvalido) {
      this.formularioFiltros.markAllAsTouched();
      this.estadoMensajeError.set(
        hayRangoInvalido
          ? 'La fecha desde no puede ser posterior a la fecha hasta.'
          : 'Revise los filtros ingresados.',
      );
      return false;
    }

    return true;
  }

  private reemplazarMatricula(matriculaActualizada: Matricula): void {
    this.estadoMatriculas.update((matriculas) =>
      matriculas.map((matricula) =>
        matricula.id === matriculaActualizada.id
          ? matriculaActualizada
          : matricula,
      ),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar la matrícula.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar matrículas.';
    }

    if (error.status === 404) {
      return 'La matrícula solicitada no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar matrículas.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar la matrícula.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos ingresados.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'MATRICULA_TRANSICION_INVALIDA') {
      return 'La transición de estado de la matrícula no está permitida.';
    }

    return cuerpo?.message || 'No fue posible completar la operación solicitada.';
  }
}
