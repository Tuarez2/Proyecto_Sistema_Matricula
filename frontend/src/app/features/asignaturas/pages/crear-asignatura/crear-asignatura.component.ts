import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import type { SolicitudCrearAsignatura } from '../../models/asignatura.model';
import { AsignaturasService } from '../../services/asignaturas.service';
import { BotonAtrasComponent } from '../../../../shared/components/boton-atras/boton-atras.component';

interface ControlesFormularioAsignatura {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  creditos: FormControl<number | null>;
  nivel_academico: FormControl<number | null>;
}

@Component({
  selector: 'app-crear-asignatura',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BotonAtrasComponent],
  templateUrl: './crear-asignatura.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearAsignaturaComponent {
  private readonly servicio = inject(AsignaturasService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioAsignatura =
    new FormGroup<ControlesFormularioAsignatura>({
      codigo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20)],
      }),
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(150)],
      }),
      creditos: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
      nivel_academico: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
    });

  guardarAsignatura(): void {
    if (this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);

    if (this.formularioAsignatura.invalid) {
      this.formularioAsignatura.markAllAsTouched();
      this.estadoMensajeError.set('Revise los datos de la asignatura.');
      return;
    }

    this.estadoEnviando.set(true);
    this.servicio
      .crearAsignatura(this.construirSolicitud())
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Asignatura creada correctamente.',
          );
          void this.enrutador.navigateByUrl('/asignaturas');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    void this.enrutador.navigateByUrl('/asignaturas');
  }

  private construirSolicitud(): SolicitudCrearAsignatura {
    const valores = this.formularioAsignatura.getRawValue();

    return {
      codigo: valores.codigo.trim().toUpperCase(),
      nombre: valores.nombre.trim(),
      creditos: Number(valores.creditos),
      nivel_academico: Number(valores.nivel_academico),
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar la asignatura.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar asignaturas.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al guardar la asignatura.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar la asignatura.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'EMPTY_UPDATE_PAYLOAD') {
      return 'Debe enviar al menos un campo para actualizar la asignatura.';
    }

    return 'Revise los datos de la asignatura.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'UNIQUE_CONSTRAINT_ERROR') {
      return 'El código de asignatura ya está registrado.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos de la asignatura.';
  }
}