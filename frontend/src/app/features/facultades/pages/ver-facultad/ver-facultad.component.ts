import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import type { Facultad } from '../../models/facultad.model';
import { FacultadesService } from '../../services/facultades.service';

@Component({
  selector: 'app-ver-facultad',
  standalone: true,
  imports: [CommonModule, RouterLink, FechaPipe],
  templateUrl: './ver-facultad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerFacultadComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(FacultadesService);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoFacultad = signal<Facultad | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);

  readonly facultad = this.estadoFacultad.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();

  ngOnInit(): void {
    const idFacultad = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idFacultad) || idFacultad < 1) {
      this.estadoMensajeError.set('El identificador de la facultad no es válido.');
      return;
    }

    this.cargarFacultad(idFacultad);
  }

  obtenerEtiquetaEstado(facultad: Facultad): string {
    return facultad.activo ? 'Activa' : 'Inactiva';
  }

  obtenerClaseEstado(facultad: Facultad): string {
    return facultad.activo ? 'estado-badge--success' : 'estado-badge--neutral';
  }

  private cargarFacultad(idFacultad: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);
    this.servicio.obtenerFacultad(idFacultad)
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoFacultad.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar la facultad.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar facultades.';
    }

    if (error.status === 404) {
      return 'La facultad solicitada no existe.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al consultar la facultad.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible consultar la facultad.';
  }
}
