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
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { DocenteFilterComponent } from '../../components/docente-filter/docente-filter.component';
import { DocenteTableComponent } from '../../components/docente-table/docente-table.component';
import type { Docente, FiltrosDocentes } from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';

const LIMITE_POR_PAGINA = 10;

@Component({
  selector: 'app-listar-docentes',
  standalone: true,
  imports: [DocenteFilterComponent, DocenteTableComponent, PaginationComponent, RouterLink],
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

  readonly docentes = this.estadoDocentes.asReadonly();
  readonly totalDocentes = this.estadoTotalDocentes.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly cargandoDocentes = this.estadoCargandoDocentes.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly docenteProcesando = this.estadoDocenteProcesando.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );

  ngOnInit(): void {
    this.cargarDocentes();
  }

  cargarDocentes(): void {
    if (this.cargandoDocentes()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoCargandoDocentes.set(true);
    this.docentesService.listarDocentes({
      ...this.estadoFiltrosAplicados(),
      pagina: this.estadoPaginaActual(),
      limite: LIMITE_POR_PAGINA,
    })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoDocentes.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoDocentes.set(respuesta.data ?? []);
          this.estadoTotalDocentes.set(respuesta.total);
          this.estadoTotalPaginas.set(respuesta.totalPages);
          this.estadoPaginaActual.set(respuesta.page);
        },
        error: (error: unknown) => {
          this.estadoDocentes.set([]);
          this.estadoTotalDocentes.set(0);
          this.estadoTotalPaginas.set(1);
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  filtrar(filtros: FiltrosDocentes): void {
    if (this.cargandoDocentes()) {
      return;
    }

    this.estadoFiltrosAplicados.set(filtros);
    this.estadoPaginaActual.set(1);
    this.cargarDocentes();
  }

  cambiarPagina(pagina: number): void {
    if (this.cargandoDocentes() || pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.cargarDocentes();
  }

  editarDocente(docente: Docente): void {
    void this.router.navigate(['/docentes/editar', docente.id]);
  }

  cambiarEstadoDocente(docente: Docente): void {
    if (!this.esAdministrador() || this.docenteProcesando() !== null) {
      return;
    }

    const accion = docente.activo ? 'inactivar' : 'activar';
    const confirmado = window.confirm(
      `¿Desea ${accion} a ${this.obtenerNombreCompleto(docente)}?`,
    );

    if (!confirmado) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoDocenteProcesando.set(docente.id);
    this.docentesService.cambiarEstadoDocente(docente.id, !docente.activo)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoDocenteProcesando.set(null)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ??
              (docente.activo
                ? 'Docente inactivado correctamente.'
                : 'Docente activado correctamente.'),
          );
          this.cargarDocentes();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerNombreCompleto(docente: Docente): string {
    return `${docente.nombres} ${docente.apellidos}`.trim();
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
