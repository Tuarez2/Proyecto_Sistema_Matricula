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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type EstadoAcademicoEstudiante,
  type Estudiante,
  type FiltrosEstudiantes,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';

@Component({
  selector: 'app-listar-estudiantes',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PaginationComponent],
  templateUrl: './listar-estudiantes.component.html',
  styleUrl: './listar-estudiantes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarEstudiantesComponent implements OnInit {
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoEstudiantes = signal<Estudiante[]>([]);
  private readonly estadoCargandoEstudiantes = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoLimitePorPagina = signal(10);
  private readonly estadoEstudianteProcesando = signal<number | null>(null);
  private readonly estadoFiltrosAplicados = signal<FiltrosEstudiantes>({});

  readonly ESTADOS_ACADEMICOS_ESTUDIANTE = ESTADOS_ACADEMICOS_ESTUDIANTE;
  readonly estudiantes = this.estadoEstudiantes.asReadonly();
  readonly cargandoEstudiantes = this.estadoCargandoEstudiantes.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly limitePorPagina = this.estadoLimitePorPagina.asReadonly();
  readonly estudianteProcesando = this.estadoEstudianteProcesando.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly formularioFiltros = this.constructorFormulario.nonNullable.group({
    busqueda: ['', [Validators.maxLength(150)]],
    carreraId: [''],
    estadoAcademico: [''],
  });
  readonly estudiantesFiltrados = computed(() =>
    this.filtrarEstudiantes(this.estudiantes(), this.estadoFiltrosAplicados()),
  );
  readonly totalEstudiantes = computed(() => this.estudiantesFiltrados().length);
  readonly totalPaginas = computed(() =>
    Math.ceil(this.totalEstudiantes() / this.limitePorPagina()),
  );
  readonly estudiantesPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limitePorPagina();

    return this.estudiantesFiltrados().slice(
      inicio,
      inicio + this.limitePorPagina(),
    );
  });
  readonly carrerasDisponibles = computed(() => {
    const carreras = new Map<number, string>();

    this.estudiantes().forEach((estudiante) => {
      if (estudiante.carrera) {
        carreras.set(estudiante.carrera.id, estudiante.carrera.nombre);
      }
    });

    return Array.from(carreras.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((actual, siguiente) => actual.nombre.localeCompare(siguiente.nombre));
  });

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    if (this.cargandoEstudiantes()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoCargandoEstudiantes.set(true);
    this.estudiantesService.listarEstudiantes()
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoEstudiantes.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoEstudiantes.set(respuesta.data ?? []);
          this.asegurarPaginaValida();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  buscarEstudiantes(): void {
    if (this.cargandoEstudiantes()) {
      return;
    }

    if (this.formularioFiltros.invalid) {
      this.formularioFiltros.markAllAsTouched();
      return;
    }

    this.estadoFiltrosAplicados.set(this.obtenerFiltrosEstudiantes());
    this.estadoPaginaActual.set(1);
  }

  limpiarFiltros(): void {
    if (this.cargandoEstudiantes()) {
      return;
    }

    this.formularioFiltros.reset({
      busqueda: '',
      carreraId: '',
      estadoAcademico: '',
    });
    this.estadoFiltrosAplicados.set({});
    this.estadoPaginaActual.set(1);
  }

  cambiarPagina(pagina: number): void {
    if (this.cargandoEstudiantes()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.asegurarPaginaValida();
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
          if (respuesta.data) {
            this.reemplazarEstudiante(respuesta.data);
          }
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Estudiante inactivado correctamente.',
          );
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

  private obtenerFiltrosEstudiantes(): FiltrosEstudiantes {
    const valores = this.formularioFiltros.getRawValue();
    const filtros: FiltrosEstudiantes = {};
    const busqueda = valores.busqueda.trim();
    const carreraId = Number(valores.carreraId);

    if (busqueda) {
      filtros.busqueda = busqueda;
    }

    if (Number.isInteger(carreraId) && carreraId > 0) {
      filtros.carreraId = carreraId;
    }

    if (this.esEstadoAcademico(valores.estadoAcademico)) {
      filtros.estadoAcademico = valores.estadoAcademico;
    }

    return filtros;
  }

  private filtrarEstudiantes(
    estudiantes: Estudiante[],
    filtros: FiltrosEstudiantes,
  ): Estudiante[] {
    const busqueda = filtros.busqueda?.toLowerCase();
    let resultado = estudiantes;

    if (busqueda) {
      resultado = resultado.filter((estudiante) =>
        [
          estudiante.numero_matricula,
          estudiante.identificacion,
          estudiante.nombres,
          estudiante.apellidos,
          estudiante.correo,
        ]
          .join(' ')
          .toLowerCase()
          .includes(busqueda),
      );
    }

    if (filtros.carreraId) {
      resultado = resultado.filter(
        (estudiante) => estudiante.carrera_id === filtros.carreraId,
      );
    }

    if (filtros.estadoAcademico) {
      resultado = resultado.filter(
        (estudiante) => estudiante.estado_academico === filtros.estadoAcademico,
      );
    }

    return resultado;
  }

  private reemplazarEstudiante(estudianteActualizado: Estudiante): void {
    this.estadoEstudiantes.update((estudiantes) =>
      estudiantes.map((estudiante) =>
        estudiante.id === estudianteActualizado.id
          ? estudianteActualizado
          : estudiante,
      ),
    );
  }

  private asegurarPaginaValida(): void {
    const totalPaginas = this.totalPaginas();

    if (totalPaginas === 0) {
      this.estadoPaginaActual.set(1);
      return;
    }

    if (this.paginaActual() > totalPaginas) {
      this.estadoPaginaActual.set(totalPaginas);
    }
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

    if (error.status === 404) {
      return 'El estudiante no existe.';
    }

    if (error.status === 409) {
      return 'Ya existe un estudiante con esos datos.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar estudiantes.';
    }

    return error.error?.message || 'No fue posible procesar la solicitud.';
  }

  private esEstadoAcademico(
    estado: string,
  ): estado is EstadoAcademicoEstudiante {
    return Object.values(ESTADOS_ACADEMICOS_ESTUDIANTE).some(
      (estadoPermitido) => estadoPermitido === estado,
    );
  }
}
