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
  Facultad,
  SolicitudActualizarFacultad,
} from '../../models/facultad.model';
import { FacultadesService } from '../../services/facultades.service';
import { BotonAtrasComponent } from '../../../../shared/components/boton-atras/boton-atras.component';

interface ControlesFormularioEdicionFacultad {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
}

@Component({
  selector: 'app-editar-facultad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BotonAtrasComponent],
  templateUrl: './editar-facultad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarFacultadComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(FacultadesService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoFacultad = signal<Facultad | null>(null);
  private readonly estadoCargando = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private idFacultad: number | null = null;

  readonly facultad = this.estadoFacultad.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioFacultad =
    new FormGroup<ControlesFormularioEdicionFacultad>({
      codigo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20)],
      }),
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(120)],
      }),
    });

  ngOnInit(): void {
    const idFacultad = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idFacultad) || idFacultad < 1) {
      this.estadoMensajeError.set('El identificador de la facultad no es válido.');
      this.formularioFacultad.disable();
      return;
    }

    this.idFacultad = idFacultad;
    this.cargarFacultad(idFacultad);
  }

  guardarFacultad(): void {
    if (this.enviando() || this.cargando() || this.idFacultad === null) {
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
    this.servicio.actualizarFacultad(
      this.idFacultad,
      this.construirSolicitud(),
    )
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Facultad actualizada correctamente.',
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
          if (!respuesta.data) {
            this.estadoMensajeError.set('La facultad solicitada no existe.');
            return;
          }

          this.estadoFacultad.set(respuesta.data);
          this.formularioFacultad.setValue({
            codigo: respuesta.data.codigo,
            nombre: respuesta.data.nombre,
          });
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private construirSolicitud(): SolicitudActualizarFacultad {
    const valores = this.formularioFacultad.getRawValue();

    return {
      codigo: valores.codigo.trim().toUpperCase(),
      nombre: valores.nombre.trim(),
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

    if (error.status === 404) {
      return 'La facultad solicitada no existe.';
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
