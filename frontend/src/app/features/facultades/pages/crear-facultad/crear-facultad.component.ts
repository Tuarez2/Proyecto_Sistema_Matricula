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
import type { SolicitudCrearFacultad } from '../../models/facultad.model';
import { FacultadesService } from '../../services/facultades.service';

interface ControlesFormularioFacultad {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  activo: FormControl<boolean>;
}

@Component({
  selector: 'app-crear-facultad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './crear-facultad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearFacultadComponent {
  private readonly servicio = inject(FacultadesService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioFacultad = new FormGroup<ControlesFormularioFacultad>({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    activo: new FormControl(true, { nonNullable: true }),
  });

  guardarFacultad(): void {
    if (this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);

    if (this.formularioFacultad.invalid) {
      this.formularioFacultad.markAllAsTouched();
      this.estadoMensajeError.set('Revise los datos de la facultad.');
      return;
    }

    this.estadoEnviando.set(true);
    this.servicio.crearFacultad(this.construirSolicitud())
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Facultad creada correctamente.',
          );
          void this.enrutador.navigateByUrl('/facultades');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    void this.enrutador.navigateByUrl('/facultades');
  }

  private construirSolicitud(): SolicitudCrearFacultad {
    const valores = this.formularioFacultad.getRawValue();

    return {
      codigo: valores.codigo.trim().toUpperCase(),
      nombre: valores.nombre.trim(),
      activo: valores.activo,
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar la facultad.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar facultades.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al guardar la facultad.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar la facultad.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    return cuerpo?.message || 'Revise los datos de la facultad.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'FACULTAD_CODIGO_DUPLICATED') {
      return 'El código de facultad ya está registrado.';
    }

    if (cuerpo?.code === 'FACULTAD_NOMBRE_DUPLICATED') {
      return 'El nombre de facultad ya está registrado.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos de la facultad.';
  }
}
