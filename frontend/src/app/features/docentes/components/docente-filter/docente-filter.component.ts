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
  @Input() especialidades: string[] = [];

  @Output() filtrarDocentes = new EventEmitter<FiltrosDocentes>();

  readonly formularioFiltros = this.constructorFormulario.group({
    busqueda: '',
    especialidad: '',
    activo: '',
  }, {
    validators: [],
  });

  constructor() {
    this.formularioFiltros.controls.busqueda.addValidators(Validators.maxLength(150));
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
      busqueda: '',
      especialidad: '',
      activo: '',
    });
    this.filtrarDocentes.emit({});
  }

  private obtenerFiltros(): FiltrosDocentes {
    const valores = this.formularioFiltros.getRawValue();
    const filtros: FiltrosDocentes = {};
    const busqueda = valores.busqueda.trim();
    const especialidad = valores.especialidad.trim();

    if (busqueda) {
      filtros.busqueda = busqueda;
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
