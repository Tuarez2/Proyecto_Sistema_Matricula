import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let componente: ConfirmModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no usa window.confirm ni window.alert', () => {
    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();

    expect(obtenerTexto()).not.toMatch(/window\.(confirm|alert)/);
    expect(obtenerElemento('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Confirmar acción',
    );
  });

  it('abre con titulo y mensaje correctos', () => {
    componente.titulo = 'Inactivar estudiante';
    componente.mensaje = '¿Desea inactivar a Ana Vera?';
    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Inactivar estudiante');
    expect(obtenerTexto()).toContain('¿Desea inactivar a Ana Vera?');
    expect(obtenerElemento('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Inactivar estudiante',
    );
  });

  it('cancelar no ejecuta la accion', () => {
    const confirmar = vi.spyOn(componente.confirmado, 'emit');
    const cancelar = vi.spyOn(componente.cancelado, 'emit');

    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();

    clickBoton('Cancelar');

    expect(cancelar).toHaveBeenCalledTimes(1);
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('confirmar emite una sola vez aunque se haga doble clic', () => {
    const confirmar = vi.spyOn(componente.confirmado, 'emit');

    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();

    clickBoton('Confirmar');
    clickBoton('Confirmar');

    expect(confirmar).toHaveBeenCalledTimes(1);
  });

  it('Escape cancela', () => {
    const cancelar = vi.spyOn(componente.cancelado, 'emit');
    const confirmar = vi.spyOn(componente.confirmado, 'emit');

    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelar).toHaveBeenCalledTimes(1);
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('Escape no cancela mientras procesa', () => {
    const cancelar = vi.spyOn(componente.cancelado, 'emit');

    fixture.componentRef.setInput('oAbierto', true);
    componente.procesando = true;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelar).not.toHaveBeenCalled();
  });

  it('fija el foco inicial en el primer boton al abrir', async () => {
    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();
    await flushRaf();

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Cerrar');
  });

  it('restaura el foco al cerrar', async () => {
    const origen = document.createElement('button');
    document.body.appendChild(origen);
    origen.focus();
    expect(document.activeElement).toBe(origen);

    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();
    await flushRaf();

    fixture.componentRef.setInput('oAbierto', false);
    fixture.detectChanges();

    expect(document.activeElement).toBe(origen);
    origen.remove();
  });

  it('bloquea la confirmacion mientras procesa', () => {
    const confirmar = vi.spyOn(componente.confirmado, 'emit');
    const cancelar = vi.spyOn(componente.cancelado, 'emit');

    fixture.componentRef.setInput('oAbierto', true);
    componente.procesando = true;
    fixture.detectChanges();

    clickBoton('Confirmar');
    clickBoton('Cancelar');

    expect(confirmar).not.toHaveBeenCalled();
    expect(cancelar).not.toHaveBeenCalled();

    expect(obtenerBoton('Confirmar')?.disabled).toBe(true);
  });

  it('permite reintentar tras un error al volver a habilitarse', () => {
    const confirmar = vi.spyOn(componente.confirmado, 'emit');

    fixture.componentRef.setInput('oAbierto', true);
    fixture.detectChanges();

    clickBoton('Confirmar');
    expect(confirmar).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('procesando', true);
    fixture.detectChanges();

    clickBoton('Confirmar');
    expect(confirmar).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('procesando', false);
    fixture.detectChanges();

    clickBoton('Confirmar');
    expect(confirmar).toHaveBeenCalledTimes(2);
  });

  it('usar la variante peligrosa aplica la clase btn-danger', () => {
    fixture.componentRef.setInput('oAbierto', true);
    componente.peligroso = true;
    fixture.detectChanges();

    const botonConfirmar = obtenerBoton('Confirmar');

    expect(botonConfirmar?.classList.contains('btn-danger')).toBe(true);
  });

  it('no se muestra el dialogo cerrado', () => {
    expect(obtenerElemento('[role="dialog"]')).toBeNull();
  });

  function clickBoton(texto: string): void {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    botones
      .find((boton) => boton.textContent?.includes(texto))
      ?.click();
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return (
      botones.find((boton) => boton.textContent?.includes(texto)) ?? null
    );
  }

  function obtenerElemento(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function flushRaf(): Promise<void> {
    return new Promise((resolver) => {
      requestAnimationFrame(() => resolver());
    });
  }
});