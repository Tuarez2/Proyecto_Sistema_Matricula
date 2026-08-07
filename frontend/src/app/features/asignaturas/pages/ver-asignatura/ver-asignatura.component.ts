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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import type {
  Asignatura,
  CarreraAsignaturaResumen,
} from '../../models/asignatura.model';
import { AsignaturasService } from '../../services/asignaturas.service';

@Component({
  selector: 'app-ver-asignatura',
  standalone: true,
  imports: [CommonModule, RouterLink, FechaPipe],
  templateUrl: './ver-asignatura.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerAsignaturaComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(AsignaturasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoAsignatura = signal<Asignatura | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly asignatura = this.estadoAsignatura.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()?.rol?.codigo ===
      CODIGOS_ROL.ADMIN,
  );

  ngOnInit(): void {
    const idAsignatura = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idAsignatura) || idAsignatura < 1) {
      this.estadoMensajeError.set(
        'El identificador de la asignatura no es válido.',
      );
      return;
    }

    this.cargarAsignatura(idAsignatura);
  }

  obtenerEtiquetaEstado(asignatura: Asignatura): string {
    return asignatura.activo ? 'Activa' : 'Inactiva';
  }

  obtenerClaseEstado(asignatura: Asignatura): string {
    return asignatura.activo ? 'estado-badge--success' : 'estado-badge--neutral';
  }

  obtenerNombreCarrera(carrera: CarreraAsignaturaResumen): string {
    const codigo = carrera.codigo ? `${carrera.codigo} - ` : '';
    const estado = carrera.activo === false ? ' (inactiva)' : '';
    return `${codigo}${carrera.nombre}${estado}`;
  }

  private cargarAsignatura(idAsignatura: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.servicio
      .obtenerAsignatura(idAsignatura)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoAsignatura.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar la asignatura.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar asignaturas.';
    }

    if (error.status === 404) {
      return 'La asignatura solicitada no existe.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar la asignatura.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar la asignatura.';
  }
}