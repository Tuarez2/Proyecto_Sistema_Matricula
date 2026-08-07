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
import type { Carrera, FacultadCarrera } from '../../models/carrera.model';
import { CarrerasService } from '../../services/carreras.service';

@Component({
  selector: 'app-ver-carrera',
  standalone: true,
  imports: [CommonModule, RouterLink, FechaPipe],
  templateUrl: './ver-carrera.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerCarreraComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(CarrerasService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoCarrera = signal<Carrera | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly carrera = this.estadoCarrera.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly esAdministrador = computed(
    () =>
      this.autenticacionService.usuarioActual()
        ?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );

  ngOnInit(): void {
    const idCarrera = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idCarrera) || idCarrera < 1) {
      this.estadoMensajeError.set('El identificador de la carrera no es válido.');
      return;
    }

    this.cargarCarrera(idCarrera);
  }

  obtenerEtiquetaEstado(carrera: Carrera): string {
    return carrera.activo ? 'Activa' : 'Inactiva';
  }

  obtenerClaseEstado(carrera: Carrera): string {
    return carrera.activo ? 'estado-badge--success' : 'estado-badge--neutral';
  }

  obtenerNombreFacultad(facultad: FacultadCarrera | null | undefined): string {
    if (!facultad) {
      return 'Sin facultad';
    }

    const codigo = facultad.codigo ? `${facultad.codigo} - ` : '';
    const estado = facultad.activo === false ? ' (inactiva)' : '';
    return `${codigo}${facultad.nombre}${estado}`;
  }

  private cargarCarrera(idCarrera: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.servicio.obtenerCarrera(idCarrera)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCarrera.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar la carrera.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar carreras.';
    }

    if (error.status === 404) {
      return 'La carrera solicitada no existe.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar la carrera.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar la carrera.';
  }
}
