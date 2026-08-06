import { TestBed } from '@angular/core/testing';
import {
  PreferenciasService,
  type TemaPreferido,
} from './preferencias.service';

const CLAVE_TEMA = 'preferencias.apariencia.tema';
const CLAVE_TAMANO = 'preferencias.apariencia.tamano-texto';
const CLAVE_DENSIDAD = 'preferencias.apariencia.densidad';
const CLAVE_MOVIMIENTO = 'preferencias.apariencia.movimiento';
const CLAVE_CONTRASTE = 'preferencias.accesibilidad.contraste';
const CLAVE_FOCO = 'preferencias.accesibilidad.foco';
const CLAVE_MOVIMIENTO_REDUCIDO = 'preferencias.accesibilidad.movimiento-reducido';

describe('PreferenciasService', () => {
  let servicio: PreferenciasService;

  beforeEach(() => {
    instalarAlmacenamiento();
    document.documentElement.removeAttribute('data-tema');
    document.documentElement.removeAttribute('data-tamano-texto');
    document.documentElement.removeAttribute('data-densidad');
    document.documentElement.removeAttribute('data-contraste');
    document.documentElement.removeAttribute('data-foco');
    document.documentElement.removeAttribute('data-movimiento');
    document.documentElement.removeAttribute('data-movimiento-reducido');

    TestBed.configureTestingModule({
      providers: [PreferenciasService],
    });

    servicio = TestBed.inject(PreferenciasService);
  });

  it('el tema por defecto es sistema', () => {
    expect(servicio.temaPreferido()).toBe('sistema');
  });

  it('el tema efectivo respeta prefers-color-scheme', () => {
    const temaEfectivo = servicio.temaEfectivo();

    expect(['claro', 'oscuro']).toContain(temaEfectivo);
  });

  it('establece tema claro', () => {
    servicio.establecerTema('claro');

    expect(servicio.temaPreferido()).toBe('claro');
    expect(servicio.temaEfectivo()).toBe('claro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
  });

  it('establece tema oscuro y lo aplica al documento', () => {
    servicio.establecerTema('oscuro');

    expect(servicio.temaEfectivo()).toBe('oscuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');
  });

  it('persiste el tema en localStorage', () => {
    servicio.establecerTema('oscuro');

    expect(window.localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');
  });

  it('al crear el servicio lee la preferencia guardada', () => {
    window.localStorage.setItem(CLAVE_TEMA, 'claro');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [PreferenciasService],
    });

    const nuevoServicio = TestBed.inject(PreferenciasService);

    expect(nuevoServicio.temaPreferido()).toBe('claro');
  });

  it('descarta valores no validos y usa el predeterminado', () => {
    window.localStorage.setItem(CLAVE_TEMA, 'morado');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [PreferenciasService],
    });

    const nuevoServicio = TestBed.inject(PreferenciasService);

    expect(nuevoServicio.temaPreferido()).toBe('sistema');
  });

  it('tamano de texto normal por defecto', () => {
    expect(servicio.tamanoTexto()).toBe('normal');
  });

  it('establece tamano de texto grande y lo aplica', () => {
    servicio.establecerTamanoTexto('grande');

    expect(servicio.tamanoTexto()).toBe('grande');
    expect(document.documentElement.getAttribute('data-tamano-texto')).toBe(
      'grande',
    );
    expect(window.localStorage.getItem(CLAVE_TAMANO)).toBe('grande');
  });

  it('densidad comoda por defecto', () => {
    expect(servicio.densidad()).toBe('comoda');
  });

  it('establece densidad compacta y la aplica', () => {
    servicio.establecerDensidad('compacta');

    expect(servicio.densidad()).toBe('compacta');
    expect(document.documentElement.getAttribute('data-densidad')).toBe(
      'compacta',
    );
  });

  it('movimiento normal por defecto', () => {
    expect(servicio.movimiento()).toBe('normal');
  });

  it('establece movimiento reducido', () => {
    servicio.establecerMovimiento('reducido');

    expect(servicio.movimiento()).toBe('reducido');
    expect(document.documentElement.getAttribute('data-movimiento')).toBe(
      'true',
    );
  });

  it('contraste reforzado desactivado por defecto', () => {
    expect(servicio.contrasteReforzado()).toBe(false);
  });

  it('activa contraste reforzado y lo aplica', () => {
    servicio.establecerContrasteReforzado(true);

    expect(servicio.contrasteReforzado()).toBe(true);
    expect(document.documentElement.getAttribute('data-contraste')).toBe(
      'true',
    );
    expect(window.localStorage.getItem(CLAVE_CONTRASTE)).toBe('1');
  });

  it('foco reforzado se activa', () => {
    servicio.establecerFocoReforzado(true);

    expect(servicio.focoReforzado()).toBe(true);
    expect(document.documentElement.getAttribute('data-foco')).toBe('true');
  });

  it('movimiento reducido por accesibilidad se activa', () => {
    servicio.establecerMovimientoReducido(true);

    expect(servicio.movimientoReducido()).toBe(true);
    expect(
      document.documentElement.getAttribute('data-movimiento-reducido'),
    ).toBe('true');
    expect(window.localStorage.getItem(CLAVE_MOVIMIENTO_REDUCIDO)).toBe('1');
  });

  it('restablecerPreferencias vuelve a los valores por defecto', () => {
    servicio.establecerTema('oscuro');
    servicio.establecerTamanoTexto('grande');
    servicio.establecerDensidad('compacta');
    servicio.establecerMovimiento('reducido');

    servicio.restablecerPreferencias();

    expect(servicio.temaPreferido()).toBe('sistema');
    expect(servicio.tamanoTexto()).toBe('normal');
    expect(servicio.densidad()).toBe('comoda');
    expect(servicio.movimiento()).toBe('normal');
  });

  it('restablecerAccesibilidad apaga las opciones de accesibilidad', () => {
    servicio.establecerContrasteReforzado(true);
    servicio.establecerFocoReforzado(true);
    servicio.establecerMovimientoReducido(true);

    servicio.restablecerAccesibilidad();

    expect(servicio.contrasteReforzado()).toBe(false);
    expect(servicio.focoReforzado()).toBe(false);
    expect(servicio.movimientoReducido()).toBe(false);
  });

  it('restablecerTodo apaga todo', () => {
    servicio.establecerTema('oscuro');
    servicio.establecerContrasteReforzado(true);

    servicio.restablecerTodo();

    expect(servicio.temaPreferido()).toBe('sistema');
    expect(servicio.contrasteReforzado()).toBe(false);
  });

  it('las claves guardadas se eliminan al restablecer', () => {
    servicio.establecerTema('oscuro');
    servicio.restablecerPreferencias();

    expect(window.localStorage.getItem(CLAVE_TEMA)).toBe('sistema');
    expect(window.localStorage.getItem(CLAVE_CONTRASTE)).toBeNull();
  });

  it('no genera opciones prohibidas en el estado', () => {
    const tema: TemaPreferido = servicio.temaPreferido();

    expect(['claro', 'oscuro', 'sistema']).toContain(tema);
  });

  function instalarAlmacenamiento(): void {
    const valores = new Map<string, string>();

    const almacenamiento = {
      get length(): number {
        return valores.size;
      },
      clear: () => valores.clear(),
      getItem: (clave: string) => valores.get(clave) ?? null,
      key: (indice: number) => Array.from(valores.keys())[indice] ?? null,
      removeItem: (clave: string) => {
        valores.delete(clave);
      },
      setItem: (clave: string, valor: string) => {
        valores.set(clave, valor);
      },
    };

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: almacenamiento,
    });
  }
});
