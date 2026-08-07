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

  it('cambiar el select de estado emite inmediatamente', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.controls.activo.setValue('true');

    expect(filtrar).toHaveBeenCalledWith({ activo: true } satisfies FiltrosDocentes);
  });

  it('emite activo falso cuando se filtran inactivos', () => {
    const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

    componente.formularioFiltros.controls.activo.setValue('false');

    expect(filtrar).toHaveBeenCalledWith({ activo: false });
  });

  it('la busqueda de texto no emite con cada tecla', () => {
    vi.useFakeTimers();
    try {
      const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

      componente.formularioFiltros.controls.nombres.setValue('An');
      vi.advanceTimersByTime(100);

      expect(filtrar).not.toHaveBeenCalled();

      componente.formularioFiltros.controls.nombres.setValue('Ana');
      vi.advanceTimersByTime(400);

      expect(filtrar).toHaveBeenCalledTimes(1);
      expect(filtrar).toHaveBeenCalledWith({
        nombres: 'Ana',
      } satisfies FiltrosDocentes);
    } finally {
      vi.useRealTimers();
    }
  });

  it('normaliza la busqueda con trim', () => {
    vi.useFakeTimers();
    try {
      const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');

      componente.formularioFiltros.controls.identificacion.setValue(' 1002003004 ');
      vi.advanceTimersByTime(400);

      expect(filtrar).toHaveBeenCalledWith({
        identificacion: '1002003004',
      } satisfies FiltrosDocentes);
    } finally {
      vi.useRealTimers();
    }
  });

  it('combina texto y selector en un solo filtro', () => {
    vi.useFakeTimers();
    try {
      const filtrar = vi.spyOn(componente.filtrarDocentes, 'emit');
      filtrar.mockClear();

      componente.formularioFiltros.controls.nombres.setValue('Ana');
      componente.formularioFiltros.controls.activo.setValue('true');
      vi.advanceTimersByTime(400);

      expect(filtrar).toHaveBeenCalledWith({
        nombres: 'Ana',
        activo: true,
      } satisfies FiltrosDocentes);
    } finally {
      vi.useRealTimers();
    }
  });

  it('limpiar filtros restablece el formulario y emite objeto vacio', () => {
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

  it('no existen botones Buscar en el filtro', () => {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    expect(botones.some((boton) => boton.textContent?.includes('Buscar'))).toBe(false);
  });
});