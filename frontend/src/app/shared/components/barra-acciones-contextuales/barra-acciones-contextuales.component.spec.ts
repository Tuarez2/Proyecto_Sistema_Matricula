import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BarraAccionesContextualesComponent,
  type AccionContextual,
} from './barra-acciones-contextuales.component';

describe('BarraAccionesContextualesComponent', () => {
  let fixture: ComponentFixture<BarraAccionesContextualesComponent>;
  let componente: BarraAccionesContextualesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraAccionesContextualesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarraAccionesContextualesComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no muestra la barra sin selección', () => {
    expect(obtenerTexto()).not.toContain('1 registro seleccionado');
  });

  it('muestra el conteo y las acciones con selección', () => {
    fixture.componentRef.setInput('haySeleccion', true);
    fixture.componentRef.setInput('acciones', [
      { id: 'ver', etiqueta: 'Ver' },
      { id: 'inactivar', etiqueta: 'Inactivar', variante: 'danger' },
    ]);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('1 registro seleccionado');
    expect(obtenerTexto()).toContain('Ver');
    expect(obtenerTexto()).toContain('Inactivar');
  });

  it('emite el id de la acción al pulsarla', () => {
    const ejecutar = vi.spyOn(componente.ejecutar, 'emit');
    fixture.componentRef.setInput('haySeleccion', true);
    fixture.componentRef.setInput('acciones', [
      { id: 'editar', etiqueta: 'Editar' },
    ]);
    fixture.detectChanges();

    obtenerBoton('Editar')?.click();

    expect(ejecutar).toHaveBeenCalledWith('editar');
  });

  it('aplica la variante danger a la acción destructiva', () => {
    fixture.componentRef.setInput('haySeleccion', true);
    fixture.componentRef.setInput('acciones', [
      { id: 'retirar', etiqueta: 'Retirar', variante: 'danger' },
      { id: 'ver', etiqueta: 'Ver' },
    ]);
    fixture.detectChanges();

    expect(obtenerBoton('Retirar')?.classList.contains('btn-danger')).toBe(
      true,
    );
    expect(obtenerBoton('Ver')?.classList.contains('btn-danger')).toBe(false);
  });

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return (
      botones.find((boton) => boton.textContent?.includes(texto)) ?? null
    );
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});
