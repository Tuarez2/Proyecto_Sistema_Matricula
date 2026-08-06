import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasService } from '../../../core/services/preferencias.service';
import { PreferenciasPanelComponent } from './preferencias-panel.component';

describe('PreferenciasPanelComponent', () => {
  let fixture: ComponentFixture<PreferenciasPanelComponent>;
  let componente: PreferenciasPanelComponent;
  let preferenciasService: PreferenciasService;

  beforeEach(async () => {
    limpiarAlmacenamiento();
    document.documentElement.removeAttribute('data-tema');

    await TestBed.configureTestingModule({
      imports: [PreferenciasPanelComponent],
      providers: [PreferenciasService],
    }).compileComponents();

    preferenciasService = TestBed.inject(PreferenciasService);
    fixture = TestBed.createComponent(PreferenciasPanelComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('muestra el titulo Preferencias', () => {
    expect(obtenerTexto()).toContain('Preferencias');
  });

  it('ofrece las opciones de tema claro, oscuro y sistema', () => {
    const etiquetas = componente.opcionesTema.map((opcion) => opcion.etiqueta);

    expect(etiquetas).toEqual(['Claro', 'Oscuro', 'Sistema']);
  });

  it('seleccionar tema oscuro actualiza el servicio y el documento', () => {
    componente.seleccionarTema('oscuro');

    expect(preferenciasService.temaPreferido()).toBe('oscuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');
  });

  it('seleccionar tema claro actualiza el servicio', () => {
    componente.seleccionarTema('claro');

    expect(preferenciasService.temaPreferido()).toBe('claro');
  });

  it('seleccionar tamano grande actualiza el servicio', () => {
    componente.seleccionarTamano('grande');

    expect(preferenciasService.tamanoTexto()).toBe('grande');
  });

  it('seleccionar densidad compacta actualiza el servicio', () => {
    componente.seleccionarDensidad('compacta');

    expect(preferenciasService.densidad()).toBe('compacta');
  });

  it('seleccionar movimiento reducido actualiza el servicio', () => {
    componente.seleccionarMovimiento('reducido');

    expect(preferenciasService.movimiento()).toBe('reducido');
  });

  it('alternar contraste reforzado cambia el estado', () => {
    componente.alternarContraste();

    expect(preferenciasService.contrasteReforzado()).toBe(true);

    componente.alternarContraste();

    expect(preferenciasService.contrasteReforzado()).toBe(false);
  });

  it('alternar foco reforzado cambia el estado', () => {
    componente.alternarFoco();

    expect(preferenciasService.focoReforzado()).toBe(true);
  });

  it('alternar movimiento reducido cambia el estado', () => {
    componente.alternarMovimientoReducido();

    expect(preferenciasService.movimientoReducido()).toBe(true);
  });

  it('restablecerPreferencias restablece apariencia', () => {
    componente.seleccionarTema('oscuro');
    componente.seleccionarTamano('grande');
    componente.seleccionarDensidad('compacta');
    componente.seleccionarMovimiento('reducido');

    componente.restablecerPreferencias();

    expect(preferenciasService.temaPreferido()).toBe('sistema');
    expect(preferenciasService.tamanoTexto()).toBe('normal');
    expect(preferenciasService.densidad()).toBe('comoda');
    expect(preferenciasService.movimiento()).toBe('normal');
  });

  it('existe un boton para restablecer preferencias', () => {
    const boton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((elemento) =>
      (elemento as HTMLButtonElement).textContent?.includes(
        'Restablecer preferencias',
      ),
    );

    expect(boton).toBeTruthy();
  });

  it('incluye seccion de accesibilidad', () => {
    expect(obtenerTexto()).toContain('Accesibilidad');
  });

  it('incluye opcion de contraste reforzado', () => {
    expect(obtenerTexto()).toContain('Contraste reforzado');
  });

  function limpiarAlmacenamiento(): void {
    const almacenamiento = window.localStorage;

    if (typeof almacenamiento.clear === 'function') {
      almacenamiento.clear();
      return;
    }

    const claves: string[] = [];

    for (let indice = 0; indice < almacenamiento.length; indice++) {
      const clave = almacenamiento.key(indice);

      if (clave) {
        claves.push(clave);
      }
    }

    for (const clave of claves) {
      almacenamiento.removeItem(clave);
    }
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});
