import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { NonNullableFormBuilder } from '@angular/forms';

import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type CarreraEstudiante,
  type EstadoAcademicoEstudiante,
  type Estudiante,
  type SolicitudCrearEstudiante,
} from '../../models/estudiante.model';
import {
  validarFechaNacimiento,
  validarIdentificacion,
  validarNombre,
  validarTelefono,
} from '../../../../shared/utils/validators';

@Component({
  selector: 'app-estudiante-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './estudiante-form.component.html',
  styleUrl: './estudiante-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteFormComponent implements OnInit, OnChanges {
  private readonly constructorFormulario = inject(NonNullableFormBuilder);

  @Input() estudianteInicial: Estudiante | null = null;
  @Input() carreras: CarreraEstudiante[] = [];
  @Input() modoEdicion = false;
  @Input() enviando = false;
  @Input() cargandoCarreras = false;

  @Output() guardarEstudiante =
    new EventEmitter<SolicitudCrearEstudiante>();
  @Output() cancelarFormulario = new EventEmitter<void>();

  readonly ESTADOS_ACADEMICOS_ESTUDIANTE = ESTADOS_ACADEMICOS_ESTUDIANTE;
  readonly formularioEstudiante = this.constructorFormulario.group({
    carreraId: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    numeroMatricula: ['', [Validators.required, Validators.maxLength(30)]],
    identificacion: ['', [Validators.required, validarIdentificacion()]],
    nombres: ['', [Validators.required, validarNombre()]],
    apellidos: ['', [Validators.required, validarNombre()]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [validarTelefono()]],
    fechaNacimiento: ['', [Validators.required, validarFechaNacimiento()]],
    estadoAcademico: this.constructorFormulario.control<EstadoAcademicoEstudiante>(
      ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
      [Validators.required],
    ),
    nivelAcademicoActual: [
      '',
      [Validators.required, Validators.pattern(/^[1-9]\d*$/)],
    ],
  });

  ngOnInit(): void {
    this.poblarFormulario();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['estudianteInicial'] && !cambios['estudianteInicial'].firstChange) {
      this.poblarFormulario();
    }
  }

  enviarFormulario(): void {
    if (this.enviando) {
      return;
    }

    if (this.formularioEstudiante.invalid) {
      this.formularioEstudiante.markAllAsTouched();
      return;
    }

    this.guardarEstudiante.emit(this.construirSolicitud());
  }

  cancelar(): void {
    if (!this.enviando) {
      this.cancelarFormulario.emit();
    }
  }

  private poblarFormulario(): void {
    const estudiante = this.estudianteInicial;

    if (!estudiante) {
      return;
    }

    this.formularioEstudiante.reset({
      carreraId: String(estudiante.carrera_id),
      numeroMatricula: estudiante.numero_matricula,
      identificacion: estudiante.identificacion,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      correo: estudiante.correo,
      telefono: estudiante.telefono ?? '',
      fechaNacimiento: estudiante.fecha_nacimiento,
      estadoAcademico: estudiante.estado_academico,
      nivelAcademicoActual: String(estudiante.nivel_academico_actual),
    });
  }

  private construirSolicitud(): SolicitudCrearEstudiante {
    const valores = this.formularioEstudiante.getRawValue();
    const telefono = valores.telefono.trim();

    return {
      carrera_id: Number(valores.carreraId),
      numero_matricula: valores.numeroMatricula.trim(),
      identificacion: valores.identificacion.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      correo: valores.correo.trim(),
      telefono: telefono || null,
      fecha_nacimiento: valores.fechaNacimiento,
      estado_academico: valores.estadoAcademico,
      nivel_academico_actual: Number(valores.nivelAcademicoActual),
    };
  }
}
