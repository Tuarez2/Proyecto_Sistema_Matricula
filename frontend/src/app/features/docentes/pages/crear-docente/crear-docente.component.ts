import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import { DocenteFormComponent } from '../../components/docente-form/docente-form.component';
import type { SolicitudCrearDocente } from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';
import { BotonAtrasComponent } from '../../../../shared/components/boton-atras/boton-atras.component';

@Component({
  selector: 'app-crear-docente',
  standalone: true,
  imports: [DocenteFormComponent, BotonAtrasComponent],
  templateUrl: './crear-docente.component.html',
  styleUrl: './crear-docente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearDocenteComponent {
  private readonly docentesService = inject(DocentesService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  guardarDocente(solicitud: SolicitudCrearDocente): void {
    if (this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoEnviando.set(true);
    this.docentesService.crearDocente(solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Docente creado correctamente.',
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

    return cuerpo?.message || 'Revise los datos ingresados.';
  }
}
