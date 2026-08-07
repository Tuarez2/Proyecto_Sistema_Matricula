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
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, tap } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  BarraAccionesContextualesComponent,
  type AccionContextual,
} from '../../../../shared/components/barra-acciones-contextuales/barra-acciones-contextuales.component';
import { DocenteFilterComponent } from '../../components/docente-filter/docente-filter.component';
import { DocenteTableComponent } from '../../components/docente-table/docente-table.component';
import type {
  Docente,
  FiltrosDocentes,
  RespuestaListadoDocentes,
} from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';

interface CambioConsulta {
  reiniciarPagina: boolean;
}

const LIMITE_POR_PAGINA = 10;

@Component({
  selector: 'app-listar-docentes',
  standalone: true,
  imports: [
    DocenteFilterComponent,
    DocenteTableComponent,
    PaginationComponent,
    ConfirmModalComponent,
    BarraAccionesContextualesComponent,
    RouterLink,
  ],
  templateUrl: './listar-docentes.component.html',
  styleUrl: './listar-docentes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarDocentesComponent implements OnInit {
  private readonly docentesService = inject(DocentesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoDocentes = signal<Docente[]>([]);
  private readonly estadoTotalDocentes = signal(0);
  private readonly estadoTotalPaginas = signal(1);
  private readonly estadoFiltrosAplicados = signal<FiltrosDocentes>({});
  private readonly estadoCargandoDocentes = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoDocenteProcesando = signal<number | null>(null);
  private readonly estadoDocenteSeleccionado = signal<Docente | null>(null);
  private readonly estadoFilaSeleccionada = signal<Docente | null>(null);
  private readonly estadoDialogoAbierto = signal(false);
  private readonly estadoDialogoTitulo = signal('');
  private readonly estadoDialogoMensaje = signal('');
  private readonly estadoDialogoPeligroso = signal(false);
  private readonly estadoDialogoProcesando = signal(false);
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

  readonly docentes = this.estadoDocentes.asReadonly();
  readonly totalDocentes = this.estadoTotalDocentes.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly cargandoDocentes = this.estadoCargandoDocentes.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly docenteProcesando = this.estadoDocenteProcesando.asReadonly();
  readonly dialogoAbierto = this.estadoDialogoAbierto.asReadonly();
  readonly dialogoTitulo = this.estadoDialogoTitulo.asReadonly();
  readonly dialogoMensaje = this.estadoDialogoMensaje.asReadonly();
  readonly dialogoPeligroso = this.estadoDialogoPeligroso.asReadonly();
  readonly dialogoProcesando = this.estadoDialogoProcesando.asReadonly();
  readonly filaSeleccionada = this.estadoFilaSeleccionada.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly accionesContextuales = computed<AccionContextual[]>(() => {
    const docente = this.estadoFilaSeleccionada();

    if (!docente || !this.esAdministrador()) {
      return [];
    }

    return [
      { id: 'editar', etiqueta: 'Editar' },
      {
        id: 'cambiar-estado',
        etiqueta: docente.activo ? 'Inactivar' : 'Activar',
        variante: docente.activo ? 'danger' : 'neutral',
      },
    ];
  });
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );

  ngOnInit(): void {
    this.consultaFiltros$
      .pipe(
        switchMap((cambio) => {
          if (cambio.reiniciarPagina) {
            this.estadoPaginaActual.set(1);
          }
          return this.consultarDocentes();
        }),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  filtrar(filtros: FiltrosDocentes): void {
    if (this.filtrosIguales(filtros)) {
      return;
    }

    this.estadoFiltrosAplicados.set(filtros);
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  limpiarFiltros(): void {
    if (this.filtrosActivos() === 0) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoFiltrosAplicados.set({});
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  seleccionarFila(docente: Docente): void {
    this.alternarSeleccion(docente);
  }

  seleccionarFilaTeclado(docente: Docente): void {
    this.alternarSeleccion(docente);
  }

  alternarSeleccion(docente: Docente): void {
    this.estadoFilaSeleccionada.set(
      this.estadoFilaSeleccionada()?.id === docente.id ? null : docente,
    );
  }

  limpiarSeleccion(): void {
    this.estadoFilaSeleccionada.set(null);
  }

  ejecutarAccionContextual(accionId: string): void {
    const docente = this.estadoFilaSeleccionada();

    if (!docente) {
      return;
    }

    switch (accionId) {
      case 'editar':
        void this.router.navigate(['/docentes/editar', docente.id]);
        break;
      case 'cambiar-estado':
        this.cambiarEstadoDocente(docente);
        break;
    }
  }

  editarDocente(docente: Docente): void {
    void this.router.navigate(['/docentes/editar', docente.id]);
  }

  cambiarEstadoDocente(docente: Docente): void {
    if (!this.esAdministrador() || this.docenteProcesando() !== null) {
      return;
    }

    const accion = docente.activo ? 'inactivar' : 'activar';
    this.estadoDocenteSeleccionado.set(docente);
    this.estadoDialogoTitulo.set(
      docente.activo ? 'Inactivar docente' : 'Activar docente',
    );
    this.estadoDialogoMensaje.set(
      `¿Desea ${accion} a ${this.obtenerNombreCompleto(docente)}?`,
    );
    this.estadoDialogoPeligroso.set(!docente.activo);
    this.estadoDialogoAbierto.set(true);
  }

  confirmarCambioEstado(): void {
    const docente = this.estadoDocenteSeleccionado();

    if (!docente) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoDocenteProcesando.set(docente.id);
    this.estadoDialogoProcesando.set(true);
    this.docentesService.cambiarEstadoDocente(docente.id, !docente.activo)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => {
          this.estadoDocenteProcesando.set(null);
          this.estadoDialogoProcesando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ??
              (docente.activo
                ? 'Docente inactivado correctamente.'
                : 'Docente activado correctamente.'),
          );
          this.estadoDialogoAbierto.set(false);
          this.estadoFilaSeleccionada.set(null);
          this.consultaFiltros$.next({ reiniciarPagina: false });
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
    this.estadoDocenteSeleccionado.set(null);
  }

  obtenerNombreCompleto(docente: Docente): string {
    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  private consultarDocentes(): Observable<RespuestaListadoDocentes> {
    this.estadoFilaSeleccionada.set(null);
    this.estadoCargandoDocentes.set(true);
    this.estadoMensajeError.set(null);
    return this.docentesService.listarDocentes({
      ...this.estadoFiltrosAplicados(),
      pagina: this.estadoPaginaActual(),
      limite: LIMITE_POR_PAGINA,
    }).pipe(
      finalize(() => this.estadoCargandoDocentes.set(false)),
      tap({
        next: (respuesta) => {
          this.estadoMensajeError.set(null);
          this.estadoDocentes.set(respuesta.data ?? []);
          this.estadoTotalDocentes.set(respuesta.total);
          this.estadoTotalPaginas.set(respuesta.totalPages);
          this.estadoPaginaActual.set(respuesta.page);
        },
      }),
      catchError((error: unknown) => {
        this.estadoDocentes.set([]);
        this.estadoTotalDocentes.set(0);
        this.estadoTotalPaginas.set(1);
        this.estadoMensajeError.set(this.obtenerMensajeError(error));
        return EMPTY;
      }),
    );
  }

  private contarFiltros(filtros: FiltrosDocentes): number {
    return Object.keys(filtros).filter(
      (clave) => filtros[clave as keyof FiltrosDocentes] !== undefined,
    ).length;
  }

  private filtrosIguales(filtros: FiltrosDocentes): boolean {
    const actuales = this.estadoFiltrosAplicados();

    return JSON.stringify(filtros) === JSON.stringify(actuales);
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar docentes.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar docentes.';
    }

    if (error.status === 404) {
      return 'El docente no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return 'Ya existe un docente con la identificación o correo indicado.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al procesar docentes.';
    }

    return error.error?.message || 'No fue posible procesar la solicitud.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'EMPTY_UPDATE_PAYLOAD') {
      return 'Debe enviar al menos un campo válido.';
    }

    return cuerpo?.message || 'Revise los datos ingresados.';
  }
}