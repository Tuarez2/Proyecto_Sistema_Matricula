import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { FiltrosDocentes } from '../../models/docente.model';

interface ControlesFiltrosDocentes {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  especialidad: string;
  activo: string;
}

@Component({
  selector: 'app-docente-filter',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './docente-filter.component.html',
  styleUrl: './docente-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocenteFilterComponent {
  private readonly constructorFormulario = inject(NonNullableFormBuilder);

  @Input() cargando = false;

  @Output() filtrarDocentes = new EventEmitter<FiltrosDocentes>();

  readonly formularioFiltros = this.constructorFormulario.group<ControlesFiltrosDocentes>({
    identificacion: '',
    nombres: '',
    apellidos: '',
    correo: '',
    especialidad: '',
    activo: '',
  }, {
    validators: [],
  });

  constructor() {
    this.formularioFiltros.controls.identificacion.addValidators(Validators.maxLength(20));
    this.formularioFiltros.controls.nombres.addValidators(Validators.maxLength(100));
    this.formularioFiltros.controls.apellidos.addValidators(Validators.maxLength(100));
    this.formularioFiltros.controls.correo.addValidators(Validators.maxLength(150));
    this.formularioFiltros.controls.especialidad.addValidators(Validators.maxLength(150));
  }

  aplicarFiltros(): void {
    if (this.cargando) {
      return;
    }

    if (this.formularioFiltros.invalid) {
      this.formularioFiltros.markAllAsTouched();
      return;
    }

    this.filtrarDocentes.emit(this.obtenerFiltros());
  }

  limpiarFiltros(): void {
    if (this.cargando) {
      return;
    }

    this.formularioFiltros.reset({
      identificacion: '',
      nombres: '',
      apellidos: '',
      correo: '',
      especialidad: '',
      activo: '',
    });
    this.filtrarDocentes.emit({});
  }

  private obtenerFiltros(): FiltrosDocentes {
    const valores = this.formularioFiltros.getRawValue();
    const filtros: FiltrosDocentes = {};
    const identificacion = valores.identificacion.trim();
    const nombres = valores.nombres.trim();
    const apellidos = valores.apellidos.trim();
    const correo = valores.correo.trim();
    const especialidad = valores.especialidad.trim();

    if (identificacion) {
      filtros.identificacion = identificacion;
    }

    if (nombres) {
      filtros.nombres = nombres;
    }

    if (apellidos) {
      filtros.apellidos = apellidos;
    }

    if (correo) {
      filtros.correo = correo;
    }

    if (especialidad) {
      filtros.especialidad = especialidad;
    }

    if (valores.activo === 'true') {
      filtros.activo = true;
    }

    if (valores.activo === 'false') {
      filtros.activo = false;
    }

    return filtros;
  }
}
