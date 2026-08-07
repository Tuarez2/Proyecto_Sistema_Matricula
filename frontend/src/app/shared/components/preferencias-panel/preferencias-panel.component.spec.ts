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

  it('la opcion de texto ampliado se aplica globalmente', () => {
    componente.seleccionarTamano('grande');
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('data-tamano-texto')).toBe(
      'grande',
    );
  });

  it('seleccionar densidad compacta actualiza el servicio', () => {
    componente.seleccionarDensidad('compacta');

    expect(preferenciasService.densidad()).toBe('compacta');
  });

  it('alternar contraste reforzado cambia el estado', () => {
    componente.alternarContraste();

    expect(preferenciasService.contrasteReforzado()).toBe(true);
    expect(document.documentElement.getAttribute('data-contraste')).toBe(
      'reforzado',
    );

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
    expect(
      document.documentElement.getAttribute('data-movimiento-reducido'),
    ).toBe('true');
  });

  it('restablecerPreferencias restablece apariencia y accesibilidad', () => {
    componente.seleccionarTema('oscuro');
    componente.seleccionarTamano('grande');
    componente.seleccionarDensidad('compacta');
    componente.alternarContraste();
    componente.alternarFoco();
    componente.alternarMovimientoReducido();

    componente.restablecerPreferencias();

    expect(preferenciasService.temaPreferido()).toBe('sistema');
    expect(preferenciasService.tamanoTexto()).toBe('normal');
    expect(preferenciasService.densidad()).toBe('comoda');
    expect(preferenciasService.contrasteReforzado()).toBe(false);
    expect(preferenciasService.focoReforzado()).toBe(false);
    expect(preferenciasService.movimientoReducido()).toBe(false);
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

  it('incluye opcion de reduccion de movimiento', () => {
    expect(obtenerTexto()).toContain('Reducir movimiento');
  });

  it('incluye el control de tamano de texto dentro de accesibilidad', () => {
    const seccionAccesibilidad = fixture.nativeElement.querySelector(
      '#grupo-accesibilidad',
    )?.parentElement;

    expect(seccionAccesibilidad?.textContent).toContain('Tamaño de texto');
    expect(seccionAccesibilidad?.textContent).toContain('Ampliado');
  });

  it('indica que los cambios se aplican en este dispositivo', () => {
    expect(obtenerTexto()).toContain('Los cambios se aplican de inmediato');
  });

  it('los interruptores tienen etiquetas asociadas', () => {
    const interruptores = fixture.nativeElement.querySelectorAll(
      '.interruptor input[type="checkbox"]',
    );

    expect(interruptores.length).toBeGreaterThanOrEqual(3);

    for (const interruptor of Array.from(interruptores)) {
      const etiqueta = (interruptor as HTMLInputElement).closest('label');
      const texto = etiqueta?.textContent?.trim();

      expect(texto).toBeTruthy();
    }
  });

  it('refleja los valores restaurados desde el servicio', () => {
    preferenciasService.establecerTamanoTexto('grande');
    preferenciasService.establecerContrasteReforzado(true);
    preferenciasService.establecerMovimientoReducido(true);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Ampliado');
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
