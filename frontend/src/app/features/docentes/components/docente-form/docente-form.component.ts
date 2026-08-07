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
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type {
  Docente,
  SolicitudCrearDocente,
} from '../../models/docente.model';
import {
  validarIdentificacion,
  validarNombre,
  validarTelefono,
} from '../../../../shared/utils/validators';

@Component({
  selector: 'app-docente-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './docente-form.component.html',
  styleUrl: './docente-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocenteFormComponent implements OnInit, OnChanges {
  private readonly constructorFormulario = inject(NonNullableFormBuilder);

  @Input() docenteInicial: Docente | null = null;
  @Input() modoEdicion = false;
  @Input() enviando = false;

  @Output() guardarDocente = new EventEmitter<SolicitudCrearDocente>();
  @Output() cancelarFormulario = new EventEmitter<void>();

  readonly formularioDocente = this.constructorFormulario.group({
    identificacion: ['', [Validators.required, validarIdentificacion()]],
    nombres: ['', [Validators.required, validarNombre()]],
    apellidos: ['', [Validators.required, validarNombre()]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [validarTelefono()]],
    especialidad: ['', [Validators.required, Validators.maxLength(150)]],
    activo: true,
  });

  ngOnInit(): void {
    this.poblarFormulario();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['docenteInicial'] && !cambios['docenteInicial'].firstChange) {
      this.poblarFormulario();
    }
  }

  enviarFormulario(): void {
    if (this.enviando) {
      return;
    }

    if (this.formularioDocente.invalid) {
      this.formularioDocente.markAllAsTouched();
      return;
    }

    this.guardarDocente.emit(this.construirSolicitud());
  }

  cancelar(): void {
    if (!this.enviando) {
      this.cancelarFormulario.emit();
    }
  }

  private poblarFormulario(): void {
    const docente = this.docenteInicial;

    if (!docente) {
      return;
    }

    this.formularioDocente.reset({
      identificacion: docente.identificacion,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      correo: docente.correo,
      telefono: docente.telefono ?? '',
      especialidad: docente.especialidad,
      activo: docente.activo,
    });
  }

  private construirSolicitud(): SolicitudCrearDocente {
    const valores = this.formularioDocente.getRawValue();
    const telefono = valores.telefono.trim();

    return {
      identificacion: valores.identificacion.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      correo: valores.correo.trim(),
      telefono: telefono || null,
      especialidad: valores.especialidad.trim(),
      activo: valores.activo,
    };
  }
}
