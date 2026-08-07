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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import type {
  Asignatura,
  SolicitudActualizarAsignatura,
} from '../../models/asignatura.model';
import { AsignaturasService } from '../../services/asignaturas.service';

interface ControlesFormularioEdicionAsignatura {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  creditos: FormControl<number | null>;
  nivel_academico: FormControl<number | null>;
}

@Component({
  selector: 'app-editar-asignatura',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './editar-asignatura.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarAsignaturaComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(AsignaturasService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoAsignatura = signal<Asignatura | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private idAsignatura: number | null = null;

  readonly asignatura = this.estadoAsignatura.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioAsignatura =
    new FormGroup<ControlesFormularioEdicionAsignatura>({
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

  ngOnInit(): void {
    const idAsignatura = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idAsignatura) || idAsignatura < 1) {
      this.estadoMensajeError.set(
        'El identificador de la asignatura no es válido.',
      );
      this.formularioAsignatura.disable();
      return;
    }

    this.idAsignatura = idAsignatura;
    this.cargarAsignatura(idAsignatura);
  }

  guardarAsignatura(): void {
    if (
      this.enviando() ||
      this.cargando() ||
      this.idAsignatura === null
    ) {
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
      .actualizarAsignatura(this.idAsignatura, this.construirSolicitud())
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Asignatura actualizada correctamente.',
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
          if (!respuesta.data) {
            this.estadoMensajeError.set(
              'La asignatura solicitada no existe.',
            );
            return;
          }

          this.estadoAsignatura.set(respuesta.data);
          this.formularioAsignatura.setValue({
            codigo: respuesta.data.codigo,
            nombre: respuesta.data.nombre,
            creditos: respuesta.data.creditos,
            nivel_academico: respuesta.data.nivel_academico,
          });
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private construirSolicitud(): SolicitudActualizarAsignatura {
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

    if (error.status === 404) {
      return 'La asignatura solicitada no existe.';
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