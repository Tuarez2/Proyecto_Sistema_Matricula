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
    fixture.detectChanges();
  });

  it('emite filtros tipados para todos los campos', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.setValue({
      identificacion: ' 1002003004 ',
      nombres: ' Ana ',
      apellidos: ' Vera ',
      correo: ' ana.vera ',
      especialidad: ' Matemática ',
      activo: 'true',
    });
    componente.aplicarFiltros();

    expect(filtrar).toHaveBeenCalledWith({
      identificacion: '1002003004',
      nombres: 'Ana',
      apellidos: 'Vera',
      correo: 'ana.vera',
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

  it('no envía filtros vacíos', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.aplicarFiltros();

    expect(filtrar).toHaveBeenCalledWith({});
  });

  it('limpia filtros y emite objeto vacio', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.setValue({
      identificacion: '1002003004',
      nombres: 'Ana',
      apellidos: 'Vera',
      correo: 'ana.vera@universidad.edu',
      especialidad: 'Matemática',
      activo: 'true',
    });
    componente.limpiarFiltros();

    expect(componente.formularioFiltros.getRawValue()).toEqual({
      identificacion: '',
      nombres: '',
      apellidos: '',
      correo: '',
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
});
