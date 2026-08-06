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
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import type { ErrorApi } from '../../../../core/models/respuesta-api.model';
import type { Carrera } from '../../../carreras/models/carrera.model';
import { CarrerasService } from '../../../carreras/services/carreras.service';
import { EstudianteFormComponent } from '../../components/estudiante-form/estudiante-form.component';
import type {
  CarreraEstudiante,
  SolicitudCrearEstudiante,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';
import { BotonAtrasComponent } from '../../../../shared/components/boton-atras/boton-atras.component';

@Component({
  selector: 'app-crear-estudiante',
  standalone: true,
  imports: [EstudianteFormComponent, BotonAtrasComponent],
  templateUrl: './crear-estudiante.component.html',
  styleUrl: './crear-estudiante.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearEstudianteComponent implements OnInit {
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly carrerasService = inject(CarrerasService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoCarreras = signal<CarreraEstudiante[]>([]);
  private readonly estadoCargandoCarreras = signal(false);
  private readonly estadoEnviando = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeExito = signal<string | null>(null);

  readonly carreras = this.estadoCarreras.asReadonly();
  readonly cargandoCarreras = this.estadoCargandoCarreras.asReadonly();
  readonly enviando = this.estadoEnviando.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeExito = this.estadoMensajeExito.asReadonly();

  ngOnInit(): void {
    this.cargarCarreras();
  }

  guardarEstudiante(solicitud: SolicitudCrearEstudiante): void {
    if (this.enviando()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeExito.set(null);
    this.estadoEnviando.set(true);
    this.estudiantesService.crearEstudiante(solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoEnviando.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoMensajeExito.set(
            respuesta.message ?? 'Estudiante creado correctamente.',
          );
          void this.enrutador.navigateByUrl('/estudiantes');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  cancelar(): void {
    void this.enrutador.navigateByUrl('/estudiantes');
  }

  private cargarCarreras(): void {
    if (this.cargandoCarreras()) {
      return;
    }

    this.estadoCargandoCarreras.set(true);
    this.carrerasService.listarCarreras({ activo: true, limite: 100 })
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoCarreras.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoCarreras.set(
            (respuesta.data ?? []).filter((carrera) => carrera.activo)
              .map((carrera) => this.convertirCarrera(carrera)),
          );
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private convertirCarrera(carrera: Carrera): CarreraEstudiante {
    return {
      id: carrera.id,
      codigo: carrera.codigo,
      nombre: carrera.nombre,
      duracion_semestres: carrera.duracion_semestres,
      facultad_id: carrera.facultad_id,
      activo: carrera.activo,
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible procesar el estudiante.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'La sesión expiró. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para gestionar estudiantes.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeValidacion(error);
    }

    if (error.status === 409) {
      return 'Ya existe un estudiante con la matrícula, identificación o correo indicado.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error del servidor al guardar el estudiante.';
    }

    return error.error?.message || 'No fue posible procesar el estudiante.';
  }

  private obtenerMensajeValidacion(error: HttpErrorResponse): string {
    const cuerpo = error.error as Partial<ErrorApi> | null;

    if (cuerpo?.code === 'CARRERA_NOT_FOUND') {
      return 'La carrera especificada no existe.';
    }

    return cuerpo?.message || 'Revise los datos ingresados.';
  }
}
