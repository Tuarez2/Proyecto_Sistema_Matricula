import { computed, Injectable, signal } from '@angular/core';

export type TemaPreferido = 'claro' | 'oscuro' | 'sistema';
export type TamanoTexto = 'normal' | 'grande';
export type Densidad = 'comoda' | 'compacta';

export interface EstadoPreferencias {
  tema: TemaPreferido;
  tamanoTexto: TamanoTexto;
  densidad: Densidad;
}

export interface EstadoAccesibilidad {
  contrasteReforzado: boolean;
  focoReforzado: boolean;
  movimientoReducido: boolean;
}

const CLAVE_TEMA = 'preferencias.apariencia.tema';
const CLAVE_TAMANO = 'preferencias.apariencia.tamano-texto';
const CLAVE_DENSIDAD = 'preferencias.apariencia.densidad';
const CLAVE_CONTRASTE = 'preferencias.accesibilidad.contraste';
const CLAVE_FOCO = 'preferencias.accesibilidad.foco';
const CLAVE_MOVIMIENTO_REDUCIDO = 'preferencias.accesibilidad.movimiento-reducido';
const CLAVE_MOVIMIENTO_LEGADA = 'preferencias.apariencia.movimiento';

const TEMA_POR_DEFECTO: TemaPreferido = 'sistema';
const TAMANO_POR_DEFECTO: TamanoTexto = 'normal';
const DENSIDAD_POR_DEFECTO: Densidad = 'comoda';

@Injectable({
  providedIn: 'root',
})
export class PreferenciasService {
  private readonly preferenciasIniciales = this.obtenerPreferenciasIniciales();
  private readonly accesibilidadInicial = this.obtenerAccesibilidadInicial();

  readonly temaPreferido = signal<TemaPreferido>(
    this.preferenciasIniciales.tema,
  );
  readonly tamanoTexto = signal<TamanoTexto>(
    this.preferenciasIniciales.tamanoTexto,
  );
  readonly densidad = signal<Densidad>(this.preferenciasIniciales.densidad);

  readonly contrasteReforzado = signal<boolean>(
    this.accesibilidadInicial.contrasteReforzado,
  );
  readonly focoReforzado = signal<boolean>(
    this.accesibilidadInicial.focoReforzado,
  );
  readonly movimientoReducido = signal<boolean>(
    this.accesibilidadInicial.movimientoReducido,
  );

  readonly temaEfectivo = computed<TemaPreferido>(() => {
    const preferido = this.temaPreferido();

    if (preferido !== 'sistema') {
      return preferido;
    }

    return this.oscuroSegunSistema() ? 'oscuro' : 'claro';
  });

  constructor() {
    this.aplicarAtributosAlDocumento();
  }

  establecerTema(tema: TemaPreferido): void {
    this.temaPreferido.set(tema);
    this.guardar(CLAVE_TEMA, tema);
    this.aplicarTema();
  }

  establecerTamanoTexto(tamano: TamanoTexto): void {
    this.tamanoTexto.set(tamano);
    this.guardar(CLAVE_TAMANO, tamano);
    this.aplicarTamanoTexto();
  }

  establecerDensidad(densidad: Densidad): void {
    this.densidad.set(densidad);
    this.guardar(CLAVE_DENSIDAD, densidad);
    this.aplicarDensidad();
  }

  establecerContrasteReforzado(activado: boolean): void {
    this.contrasteReforzado.set(activado);
    this.guardarBoolean(CLAVE_CONTRASTE, activado);
    this.aplicarContraste();
  }

  establecerFocoReforzado(activado: boolean): void {
    this.focoReforzado.set(activado);
    this.guardarBoolean(CLAVE_FOCO, activado);
    this.aplicarFoco();
  }

  establecerMovimientoReducido(activado: boolean): void {
    this.movimientoReducido.set(activado);
    this.guardarBoolean(CLAVE_MOVIMIENTO_REDUCIDO, activado);
    this.aplicarMovimientoReducido();
  }

  restablecerPreferencias(): void {
    this.establecerTema(TEMA_POR_DEFECTO);
    this.establecerTamanoTexto(TAMANO_POR_DEFECTO);
    this.establecerDensidad(DENSIDAD_POR_DEFECTO);
    this.eliminarClave(CLAVE_MOVIMIENTO_LEGADA);
  }

  restablecerAccesibilidad(): void {
    this.establecerContrasteReforzado(false);
    this.establecerFocoReforzado(false);
    this.establecerMovimientoReducido(false);
  }

  restablecerTodo(): void {
    this.restablecerPreferencias();
    this.restablecerAccesibilidad();
  }

  suscribirseACambiosDeSistema(): void {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener(
      'change',
      () => {
        if (this.temaPreferido() === 'sistema') {
          this.aplicarTema();
        }
      },
    );
  }

  private oscuroSegunSistema(): boolean {
    if (typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private aplicarAtributosAlDocumento(): void {
    this.aplicarTema();
    this.aplicarTamanoTexto();
    this.aplicarDensidad();
    this.aplicarContraste();
    this.aplicarFoco();
    this.aplicarMovimientoReducido();
  }

  private aplicarTema(): void {
    const documento = document.documentElement;
    const tema = this.temaEfectivo();

    if (tema === 'oscuro') {
      documento.setAttribute('data-tema', 'oscuro');
    } else {
      documento.setAttribute('data-tema', 'claro');
    }
  }

  private aplicarTamanoTexto(): void {
    const documento = document.documentElement;

    if (this.tamanoTexto() === 'grande') {
      documento.setAttribute('data-tamano-texto', 'grande');
    } else {
      documento.removeAttribute('data-tamano-texto');
    }
  }

  private aplicarDensidad(): void {
    const documento = document.documentElement;

    if (this.densidad() === 'compacta') {
      documento.setAttribute('data-densidad', 'compacta');
    } else {
      documento.removeAttribute('data-densidad');
    }
  }

  private aplicarContraste(): void {
    this.aplicarAtributoCondicional(
      'data-contraste',
      'reforzado',
      this.contrasteReforzado(),
    );
  }

  private aplicarFoco(): void {
    this.aplicarAtributoCondicional(
      'data-foco',
      'reforzado',
      this.focoReforzado(),
    );
  }

  private aplicarMovimientoReducido(): void {
    this.aplicarAtributoCondicional(
      'data-movimiento-reducido',
      'true',
      this.movimientoReducido(),
    );
  }

  private aplicarAtributoCondicional(
    atributo: string,
    valorActivo: string,
    activado: boolean,
  ): void {
    const documento = document.documentElement;

    if (activado) {
      documento.setAttribute(atributo, valorActivo);
    } else {
      documento.removeAttribute(atributo);
    }
  }

  private guardar(clave: string, valor: string): void {
    try {
      window.localStorage.setItem(clave, valor);
    } catch {
      // El almacenamiento puede no estar disponible; la preferencia queda en memoria.
    }
  }

  private guardarBoolean(clave: string, valor: boolean): void {
    this.guardar(clave, valor ? '1' : '0');
  }

  private eliminarClave(clave: string): void {
    try {
      window.localStorage.removeItem(clave);
    } catch {
      // El almacenamiento puede no estar disponible.
    }
  }

  private obtenerPreferenciasIniciales(): EstadoPreferencias {
    return {
      tema: this.leerPreferencia(CLAVE_TEMA, TEMA_POR_DEFECTO),
      tamanoTexto: this.leerPreferencia(CLAVE_TAMANO, TAMANO_POR_DEFECTO),
      densidad: this.leerPreferencia(CLAVE_DENSIDAD, DENSIDAD_POR_DEFECTO),
    };
  }

  private obtenerAccesibilidadInicial(): EstadoAccesibilidad {
    const movimientoLegado = this.leer(CLAVE_MOVIMIENTO_LEGADA);

    return {
      contrasteReforzado: this.leerBoolean(CLAVE_CONTRASTE),
      focoReforzado: this.leerBoolean(CLAVE_FOCO),
      movimientoReducido:
        this.leerBoolean(CLAVE_MOVIMIENTO_REDUCIDO) ||
        movimientoLegado === 'reducido',
    };
  }

  private leerPreferencia<T extends string>(
    clave: string,
    valorPorDefecto: T,
  ): T {
    const valor = this.leer(clave);

    if (valor === valorPorDefecto) {
      return valorPorDefecto;
    }

    const opciones = this.opcionesValidas<T>(valorPorDefecto);

    return opciones.includes(valor as T) ? (valor as T) : valorPorDefecto;
  }

  private leerBoolean(clave: string): boolean {
    return this.leer(clave) === '1';
  }

  private leer(clave: string): string | null {
    try {
      return window.localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private opcionesValidas<T extends string>(valorPorDefecto: T): T[] {
    if (valorPorDefecto === 'sistema') {
      return ['claro', 'oscuro', 'sistema'] as T[];
    }

    if (valorPorDefecto === 'grande') {
      return ['normal', 'grande'] as T[];
    }

    if (valorPorDefecto === 'compacta') {
      return ['comoda', 'compacta'] as T[];
    }

    return [] as T[];
  }
}
