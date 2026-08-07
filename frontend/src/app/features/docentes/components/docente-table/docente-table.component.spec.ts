import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Docente } from '../../models/docente.model';
import { DocenteTableComponent } from './docente-table.component';

describe('DocenteTableComponent', () => {
  let fixture: ComponentFixture<DocenteTableComponent>;
  let componente: DocenteTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocenteTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocenteTableComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('docentes', [
      crearDocente({ id: 1, activo: true }),
      crearDocente({ id: 2, nombres: 'Luis', activo: false }),
    ]);
    fixture.detectChanges();
  });

  it('renderiza campos reales del backend', () => {
    expect(obtenerTexto()).toContain('1002003004');
    expect(obtenerTexto()).toContain('ana.vera@universidad.edu');
    expect(obtenerTexto()).toContain('Matemática');
  });

  it('muestra acciones administrativas cuando corresponde', () => {
    fixture.componentRef.setInput('esAdministrador', true);
    fixture.detectChanges();

    expect(obtenerBoton('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
    expect(obtenerBoton('Activar')).toBeTruthy();
  });

  it('oculta acciones para roles sin administracion', () => {
    fixture.componentRef.setInput('esAdministrador', false);
    fixture.detectChanges();

    expect(obtenerBoton('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('emite edicion y cambio de estado', () => {
    const editar = vi.spyOn(componente.editarDocente, 'emit');
    const cambiarEstado = vi.spyOn(componente.cambiarEstadoDocente, 'emit');

    fixture.componentRef.setInput('esAdministrador', true);
    fixture.detectChanges();
    obtenerBoton('Editar')?.click();
    obtenerBoton('Inactivar')?.click();

    expect(editar).toHaveBeenCalledWith(componente.docentes[0]);
    expect(cambiarEstado).toHaveBeenCalledWith(componente.docentes[0]);
  });

  it('muestra estado vacio', () => {
    fixture.componentRef.setInput('docentes', []);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('No se encontraron docentes.');
  });

  it('aplica clase de badge segun el estado', () => {
    expect(obtenerElemento('.estado-badge--success')).toBeTruthy();
    expect(obtenerElemento('.estado-badge--neutral')).toBeTruthy();
  });

  it('muestra telefono no registrado cuando es nulo', () => {
    expect(obtenerTexto()).toContain('No registrado');
  });

  it('marca la fila seleccionada según el input filaSeleccionadaId', () => {
    fixture.componentRef.setInput('filaSeleccionadaId', 2);
    fixture.detectChanges();

    expect(obtenerFila('Luis Vera').classList.contains('fila-seleccionada')).toBe(true);
    expect(obtenerFila('Ana Vera').classList.contains('fila-seleccionada')).toBe(false);
  });

  it('emite selección al pulsar una celda no interactiva', () => {
    const seleccionar = vi.spyOn(componente.seleccionarFila, 'emit');

    const celda = obtenerFila('Ana Vera').querySelector('td:not(.columna-seleccion)');
    celda?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(seleccionar).toHaveBeenCalledWith(componente.docentes[0]);
  });

  it('no emite selección al pulsar un botón interno', () => {
    fixture.componentRef.setInput('esAdministrador', true);
    fixture.detectChanges();
    const seleccionar = vi.spyOn(componente.seleccionarFila, 'emit');

    obtenerBoton('Editar')?.click();

    expect(seleccionar).not.toHaveBeenCalled();
  });

  it('emite selección por teclado con Enter', () => {
    const teclado = vi.spyOn(componente.seleccionarFilaTeclado, 'emit');

    obtenerFila('Ana Vera').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );

    expect(teclado).toHaveBeenCalledWith(componente.docentes[0]);
  });

  it('emite alternarSelección al marcar el checkbox', () => {
    const alternar = vi.spyOn(componente.alternarSeleccion, 'emit');

    obtenerCheckbox(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(alternar).toHaveBeenCalledWith(componente.docentes[0]);
  });

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function obtenerElemento(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
  }

  function obtenerFila(texto: string): HTMLTableRowElement {
    const filas = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr'),
    ) as HTMLTableRowElement[];

    const fila = filas.find((filaEncontrada) =>
      filaEncontrada.textContent?.includes(texto),
    );

    if (!fila) {
      throw new Error('No se encontró la fila del docente');
    }

    return fila;
  }

  function obtenerCheckbox(indice: number): HTMLInputElement | null {
    const checkboxes = Array.from(
      fixture.nativeElement.querySelectorAll(
        'tbody tr .columna-seleccion input[type="checkbox"]',
      ),
    ) as HTMLInputElement[];

    return checkboxes[indice] ?? null;
  }
});

function crearDocente(cambios: Partial<Docente> = {}): Docente {
  return {
    id: 1,
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    especialidad: 'Matemática',
    activo: true,
    ...cambios,
  };
}
