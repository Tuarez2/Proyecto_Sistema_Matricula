import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { DocenteFormComponent } from '../../components/docente-form/docente-form.component';
import type {
  Docente,
  SolicitudActualizarDocente,
} from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';

@Component({
  selector: 'app-editar-docente',
  standalone: true,
  imports: [DocenteFormComponent],
  templateUrl: './editar-docente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarDocenteComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly docentesService = inject(DocentesService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoDocente = signal<Docente | null>(null);
  private readonly estadoCargandoDocente = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly docente = this.estadoDocente.asReadonly();
  readonly cargandoDocente = this.estadoCargandoDocente.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();
  private idDocente = 0;

  ngOnInit(): void {
    this.idDocente = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(this.idDocente) || this.idDocente < 1) {
      this.estadoMensajeError.set('El identificador del docente no es válido.');
      return;
    }

    this.cargarDocente();
  }

  guardarDocente(solicitud: SolicitudActualizarDocente): void {
    if (this.enviando() || !this.idDocente) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoEnviando.set(true);
    this.docentesService.actualizarDocente(this.idDocente, solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          if (respuesta.data) {
            this.estadoDocente.set(respuesta.data);
          }
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Docente actualizado correctamente.',
          );
          this.volverAlListado();
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    this.volverAlListado();
  }

  private volverAlListado(): void {
    void this.enrutador.navigateByUrl('/docentes');
  }

  private cargarDocente(): void {
    this.estadoCargandoDocente.set(true);
    this.docentesService.obtenerDocente(this.idDocente)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoDocente.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoDocente.set(respuesta.data ?? null);
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar el docente.';
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
      return 'Ocurrió un error del servidor al guardar el docente.';
    }

    return error.error?.message || 'No fue posible procesar el docente.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'EMPTY_UPDATE_PAYLOAD') {
      return 'Debe enviar al menos un campo válido.';
    }

    return cuerpo?.message || 'Revise los datos ingresados.';
  }
}
