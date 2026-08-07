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
import { finalize, forkJoin } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import type { Facultad } from '../../../facultades/models/facultad.model';
import { FacultadesService } from '../../../facultades/services/facultades.service';
import type {
  Carrera,
  SolicitudActualizarCarrera,
} from '../../models/carrera.model';
import { CarrerasService } from '../../services/carreras.service';

interface ControlesFormularioEdicionCarrera {
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  duracion_semestres: FormControl<number | null>;
  facultad_id: FormControl<string>;
  activo: FormControl<boolean>;
}

@Component({
  selector: 'app-editar-carrera',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './editar-carrera.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarCarreraComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly servicio = inject(CarrerasService);
  private readonly facultadesServicio = inject(FacultadesService);
  private readonly enrutador = inject(Router);
  private readonly destruccion = inject(DestroyRef);
  private readonly estadoCarrera = signal<Carrera | null>(null);
  private readonly estadoFacultades = signal<Facultad[]>([]);
  private readonly estadoCargando = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);
  private idCarrera: number | null = null;

  readonly carrera = this.estadoCarrera.asReadonly();
  readonly facultades = this.estadoFacultades.asReadonly();
  readonly cargando = this.estadoCargando.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  readonly formularioCarrera =
    new FormGroup<ControlesFormularioEdicionCarrera>({
      codigo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20)],
      }),
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(150)],
      }),
      duracion_semestres: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
      facultad_id: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[1-9]\d*$/)],
      }),
      activo: new FormControl(true, { nonNullable: true }),
    });

  ngOnInit(): void {
    const idCarrera = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idCarrera) || idCarrera < 1) {
      this.estadoMensajeError.set('El identificador de la carrera no es válido.');
      this.formularioCarrera.disable();
      return;
    }

    this.idCarrera = idCarrera;
    this.cargarDatos(idCarrera);
  }

  guardarCarrera(): void {
    if (this.enviando() || this.cargando() || this.idCarrera === null) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);

    if (this.formularioCarrera.invalid) {
      this.formularioCarrera.markAllAsTouched();
      this.estadoMensajeError.set('Revise los datos de la carrera.');
      return;
    }

    this.estadoEnviando.set(true);
    this.servicio.actualizarCarrera(
      this.idCarrera,
      this.construirSolicitud(),
    )
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Carrera actualizada correctamente.',
          );
          void this.enrutador.navigateByUrl('/carreras');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    void this.enrutador.navigateByUrl('/carreras');
  }

  obtenerEtiquetaFacultad(facultad: Facultad): string {
    const estado = facultad.activo ? '' : ' (inactiva)';
    return `${facultad.codigo} - ${facultad.nombre}${estado}`;
  }

  private cargarDatos(idCarrera: number): void {
    this.estadoCargando.set(true);
    this.estadoMensajeError.set(null);

    forkJoin({
      carrera: this.servicio.obtenerCarrera(idCarrera),
      facultades: this.facultadesServicio.listarFacultades({ limite: 100 }),
    })
      .pipe(
        takeUntilDestroyed(this.destruccion),
        finalize(() => this.estadoCargando.set(false)),
      )
      .subscribe({
        next: ({ carrera, facultades }) => {
          if (!carrera.data) {
            this.estadoMensajeError.set('La carrera solicitada no existe.');
            return;
          }

          this.estadoCarrera.set(carrera.data);
          this.estadoFacultades.set(this.unirFacultades(
            facultades.data ?? [],
            carrera.data,
          ));
          this.formularioCarrera.setValue({
            codigo: carrera.data.codigo,
            nombre: carrera.data.nombre,
            duracion_semestres: carrera.data.duracion_semestres,
            facultad_id: String(carrera.data.facultad_id),
            activo: carrera.data.activo,
          });
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private unirFacultades(
    facultades: Facultad[],
    carrera: Carrera,
  ): Facultad[] {
    const contieneFacultadActual = facultades.some(
      (facultad) => facultad.id === carrera.facultad_id,
    );

    if (contieneFacultadActual || !carrera.facultad) {
      return facultades;
    }

    return [
      ...facultades,
      {
        id: carrera.facultad.id,
        codigo: carrera.facultad.codigo ?? '',
        nombre: carrera.facultad.nombre,
        activo: carrera.facultad.activo ?? false,
      },
    ];
  }

  private construirSolicitud(): SolicitudActualizarCarrera {
    const valores = this.formularioCarrera.getRawValue();

    return {
      codigo: valores.codigo.trim().toUpperCase(),
      nombre: valores.nombre.trim(),
      duracion_semestres: Number(valores.duracion_semestres),
      facultad_id: Number(valores.facultad_id),
      activo: valores.activo,
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar la carrera.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar carreras.';
    }

    if (error.status === 404) {
      return 'La carrera solicitada no existe.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(error);
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al guardar la carrera.';
    }

    const cuerpo = error.error as Partial<ErrorApi> | null;
    return cuerpo?.message || 'No fue posible procesar la carrera.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'FACULTAD_NOT_FOUND') {
      return 'La facultad especificada no existe.';
    }

    return cuerpo?.message || 'Revise los datos de la carrera.';
  }

  private obtenerMensajeConflicto(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'UNIQUE_CONSTRAINT_ERROR') {
      return 'El código de carrera ya está registrado.';
    }

    return cuerpo?.message || 'Existe un conflicto con los datos de la carrera.';
  }
}
