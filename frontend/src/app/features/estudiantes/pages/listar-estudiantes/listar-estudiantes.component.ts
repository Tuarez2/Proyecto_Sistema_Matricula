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
  distinctUntilChanged,
  filter,
  finalize,
  map,
  merge,
  switchMap,
  tap,
} from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import type { Carrera } from '../../../carreras/models/carrera.model';
import { CarrerasService } from '../../../carreras/services/carreras.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type EstadoAcademicoEstudiante,
  type Estudiante,
  type FiltrosEstudiantes,
  type RespuestaListadoEstudiantes,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';

interface ControlesFiltrosEstudiantes {
  numero_matricula: FormControl<string>;
  identificacion: FormControl<string>;
  nombres: FormControl<string>;
  apellidos: FormControl<string>;
  carrera_id: FormControl<string>;
  estado_academico: FormControl<string>;
  nivel_academico_actual: FormControl<string>;
}

interface CambioConsulta {
  reiniciarPagina: boolean;
}

const LIMITE_POR_PAGINA = 10;
const DEBOUNCE_BUSQUEDA_MS = 350;

@Component({
  selector: 'app-listar-estudiantes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginationComponent],
  templateUrl: './listar-estudiantes.component.html',
  styleUrl: './listar-estudiantes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarEstudiantesComponent implements OnInit {
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly carrerasService = inject(CarrerasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoEstudiantes = signal<Estudiante[]>([]);
  private readonly estadoTotalEstudiantes = signal(0);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoCarreras = signal<Carrera[]>([]);
  private readonly estadoFiltrosAplicados = signal<FiltrosEstudiantes>({});
  private readonly estadoCargandoEstudiantes = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoEstudianteProcesando = signal<number | null>(null);
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

  readonly ESTADOS_ACADEMICOS_ESTUDIANTE = ESTADOS_ACADEMICOS_ESTUDIANTE;
  readonly estudiantes = this.estadoEstudiantes.asReadonly();
  readonly totalEstudiantes = this.estadoTotalEstudiantes.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly carreras = this.estadoCarreras.asReadonly();
  readonly cargandoEstudiantes = this.estadoCargandoEstudiantes.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly estudianteProcesando = this.estadoEstudianteProcesando.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );

  readonly filtros = new FormGroup<ControlesFiltrosEstudiantes>({
    numero_matricula: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
    }),
    identificacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    carrera_id: new FormControl('', { nonNullable: true }),
    estado_academico: new FormControl('', { nonNullable: true }),
    nivel_academico_actual: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(1), Validators.max(100)],
    }),
  });

  ngOnInit(): void {
    this.cargarCarreras();
    this.configurarFiltrosDinamicos();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  buscarEstudiantes(): void {
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
    this.filtros.reset({
      numero_matricula: '',
      identificacion: '',
      nombres: '',
      apellidos: '',
      carrera_id: '',
      estado_academico: '',
      nivel_academico_actual: '',
    });
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  inactivarEstudiante(estudiante: Estudiante): void {
    if (
      !this.esAdministrador() ||
      estudiante.estado_academico === ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO ||
      this.estudianteProcesando() !== null
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Desea inactivar a ${this.obtenerNombreCompleto(estudiante)}?`,
    );

    if (!confirmado) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoEstudianteProcesando.set(estudiante.id);
    this.estudiantesService.cambiarEstadoEstudiante(estudiante.id)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEstudianteProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Estudiante inactivado correctamente.',
          );
          this.consultaFiltros$.next({ reiniciarPagina: false });
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerNombreCompleto(estudiante: Estudiante): string {
    return `${estudiante.nombres} ${estudiante.apellidos}`.trim();
  }

  obtenerEtiquetaEstado(estado: EstadoAcademicoEstudiante): string {
    if (estado === ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO) {
      return 'Activo';
    }

    if (estado === ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO) {
      return 'Inactivo';
    }

    if (estado === ESTADOS_ACADEMICOS_ESTUDIANTE.SUSPENDIDO) {
      return 'Suspendido';
    }

    return 'Egresado';
  }

  private configurarFiltrosDinamicos(): void {
    const textoDebounced = merge(
      this.filtros.controls.numero_matricula.valueChanges,
      this.filtros.controls.identificacion.valueChanges,
      this.filtros.controls.nombres.valueChanges,
      this.filtros.controls.apellidos.valueChanges,
      this.filtros.controls.nivel_academico_actual.valueChanges,
    ).pipe(
      debounceTime(DEBOUNCE_BUSQUEDA_MS),
      map(() => true),
    );

    const selectoresInmediatos = merge(
      this.filtros.controls.carrera_id.valueChanges,
      this.filtros.controls.estado_academico.valueChanges,
    ).pipe(map(() => true));

    merge(textoDebounced, selectoresInmediatos)
      .pipe(
        filter(() => this.filtros.valid && !this.criteriosIgualesAplicados()),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe(() => this.consultaFiltros$.next({ reiniciarPagina: true }));

    this.consultaFiltros$
      .pipe(
        switchMap((cambio) => {
          if (cambio.reiniciarPagina) {
            this.estadoPaginaActual.set(1);
          }
          return this.consultarEstudiantes();
        }),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe();
  }

  private criteriosIgualesAplicados(): boolean {
    const actuales = this.obtenerFiltrosActuales();
    const aplicados = this.estadoFiltrosAplicados();

    return JSON.stringify(actuales) === JSON.stringify(aplicados);
  }

  private contarFiltros(filtros: FiltrosEstudiantes): number {
    return Object.values(filtros).filter((valor) => valor !== undefined).length;
  }

  private consultarEstudiantes(): Observable<RespuestaListadoEstudiantes> {
    const filtros = this.obtenerFiltrosActuales();
    this.estadoFiltrosAplicados.set(filtros);
    this.estadoCargandoEstudiantes.set(true);
    this.estadoMensajeError.set(null);
    return this.estudiantesService.listarEstudiantes({
      ...filtros,
      pagina: this.estadoPaginaActual(),
      limite: LIMITE_POR_PAGINA,
    }).pipe(
      finalize(() => this.estadoCargandoEstudiantes.set(false)),
      tap({
        next: (respuesta) => {
          this.estadoMensajeError.set(null);
          this.estadoEstudiantes.set(respuesta.data ?? []);
          this.estadoTotalEstudiantes.set(respuesta.total);
          this.estadoTotalPaginas.set(respuesta.totalPages);
          this.estadoPaginaActual.set(respuesta.page);
        },
      }),
      catchError((error: unknown) => {
        this.estadoEstudiantes.set([]);
        this.estadoTotalEstudiantes.set(0);
        this.estadoTotalPaginas.set(1);
        this.estadoMensajeError.set(this.obtenerMensajeError(error));
        return EMPTY;
      }),
    );
  }

  private cargarCarreras(): void {
    this.carrerasService.listarCarreras({ limite: 100 })
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe({
        next: (respuesta) => this.estadoCarreras.set(respuesta.data ?? []),
        error: () => {
          this.estadoMensajeError.set(
            'No fue posible cargar las carreras para los filtros.',
          );
        },
      });
  }

  private obtenerFiltrosActuales(): FiltrosEstudiantes {
    const valores = this.filtros.getRawValue();

    return {
      numero_matricula: valores.numero_matricula.trim() || undefined,
      identificacion: valores.identificacion.trim() || undefined,
      nombres: valores.nombres.trim() || undefined,
      apellidos: valores.apellidos.trim() || undefined,
      carrera_id: this.obtenerEnteroPositivo(valores.carrera_id),
      estado_academico: this.obtenerEstadoAcademicoFiltro(
        valores.estado_academico,
      ),
      nivel_academico_actual: this.obtenerEnteroPositivo(
        valores.nivel_academico_actual,
      ),
    };
  }

  private obtenerEnteroPositivo(valor: string): number | undefined {
    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero < 1) {
      return undefined;
    }

    return numero;
  }

  private obtenerEstadoAcademicoFiltro(
    valor: string,
  ): EstadoAcademicoEstudiante | undefined {
    if (this.esEstadoAcademico(valor)) {
      return valor;
    }

    return undefined;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar estudiantes.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar estudiantes.';
    }

    if (error.status === 400) {
      return 'Revise los filtros de la consulta de estudiantes.';
    }

    if (error.status === 404) {
      return 'El estudiante no existe.';
    }

    if (error.status === 409) {
      return 'Ya existe un estudiante con esos datos.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar estudiantes.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar la solicitud.';
  }

  private esEstadoAcademico(
    estado: string,
  ): estado is EstadoAcademicoEstudiante {
    return Object.values(ESTADOS_ACADEMICOS_ESTUDIANTE).some(
      (estadoPermitido) => estadoPermitido === estado,
    );
  }
}