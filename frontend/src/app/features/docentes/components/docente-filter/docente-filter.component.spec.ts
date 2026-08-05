import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { FiltrosDocentes } from '../../models/docente.model';
import { DocenteFilterComponent } from './docente-filter.component';

describe('DocenteFilterComponent', () => {
  let fixture: ComponentFixture<DocenteFilterComponent>;
  let componente: DocenteFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocenteFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocenteFilterComponent);
    componente = fixture.componentInstance;
    componente.especialidades = ['Matemática', 'Programación'];
    fixture.detectChanges();
  });

  it('emite filtros tipados para busqueda, especialidad y estado activo', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.setValue({
      busqueda: ' Ana ',
      especialidad: 'Matemática',
      activo: 'true',
    });
    componente.aplicarFiltros();

    expect(filtrar).toHaveBeenCalledWith({
      busqueda: 'Ana',
      especialidad: 'Matemática',
      activo: true,
    } satisfies FiltrosDocentes);
  });

  it('emite activo falso cuando se filtran inactivos', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.controls.activo.setValue('false');
    componente.aplicarFiltros();

    expect(filtrar).toHaveBeenCalledWith({ activo: false });
  });

  it('limpia filtros y emite objeto vacio', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.setValue({
      busqueda: 'Ana',
      especialidad: 'Matemática',
      activo: 'true',
    });
    componente.limpiarFiltros();

    expect(componente.formularioFiltros.getRawValue()).toEqual({
      busqueda: '',
      especialidad: '',
      activo: '',
    });
    expect(filtrar).toHaveBeenCalledWith({});
  });

  it('no emite si esta cargando', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.cargando = true;
    componente.aplicarFiltros();

    expect(filtrar).not.toHaveBeenCalled();
  });

  it('muestra las especialidades recibidas', () => {
    expect(obtenerTexto()).toContain('Programación');
  });

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});
