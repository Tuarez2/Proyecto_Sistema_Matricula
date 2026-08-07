import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map, merge } from 'rxjs';

import type { FiltrosDocentes } from '../../models/docente.model';

interface ControlesFiltrosDocentes {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  especialidad: string;
  activo: string;
}

const DEBOUNCE_BUSQUEDA_MS = 350;

@Component({
  selector: 'app-docente-filter',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './docente-filter.component.html',
  styleUrl: './docente-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocenteFilterComponent implements OnInit {
  private readonly constructorFormulario = inject(NonNullableFormBuilder);
  private readonly referenciaDestruccion = inject(DestroyRef);

  @Output() filtrarDocentes = new EventEmitter<FiltrosDocentes>();

  readonly formularioFiltros = this.constructorFormulario.group<ControlesFiltrosDocentes>({
    identificacion: '',
    nombres: '',
    apellidos: '',
    correo: '',
    especialidad: '',
    activo: '',
  });

  constructor() {
    this.formularioFiltros.controls.identificacion.addValidators(Validators.maxLength(20));
    this.formularioFiltros.controls.nombres.addValidators(Validators.maxLength(100));
    this.formularioFiltros.controls.apellidos.addValidators(Validators.maxLength(100));
    this.formularioFiltros.controls.correo.addValidators(Validators.maxLength(150));
    this.formularioFiltros.controls.especialidad.addValidators(Validators.maxLength(150));
  }

  ngOnInit(): void {
    const textoDebounced = merge(
      this.formularioFiltros.controls.identificacion.valueChanges,
      this.formularioFiltros.controls.nombres.valueChanges,
      this.formularioFiltros.controls.apellidos.valueChanges,
      this.formularioFiltros.controls.correo.valueChanges,
      this.formularioFiltros.controls.especialidad.valueChanges,
    ).pipe(
      debounceTime(DEBOUNCE_BUSQUEDA_MS),
      map(() => this.obtenerFiltros()),
      distinctUntilChanged(sonFiltrosIguales),
    );

    const selectInmediato = this.formularioFiltros.controls.activo.valueChanges.pipe(
      map(() => this.obtenerFiltros()),
    );

    merge(textoDebounced, selectInmediato)
      .pipe(
        filter(() => this.formularioFiltros.valid),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe((filtros) => this.filtrarDocentes.emit(filtros));
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset(
      {
        identificacion: '',
        nombres: '',
        apellidos: '',
        correo: '',
        especialidad: '',
        activo: '',
      },
      { emitEvent: false },
    );
    this.filtrarDocentes.emit({});
  }

  impedirEnvio(evento: Event): void {
    evento.preventDefault();
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

function sonFiltrosIguales(
  anterior: FiltrosDocentes,
  actual: FiltrosDocentes,
): boolean {
  return JSON.stringify(anterior) === JSON.stringify(actual);
}