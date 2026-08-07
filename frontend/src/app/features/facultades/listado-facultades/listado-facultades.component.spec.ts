import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  Facultad,
  FiltrosFacultades,
  RespuestaCambioEstadoFacultad,
  RespuestaListadoFacultades,
} from '../models/facultad.model';
import { FacultadesService } from '../services/facultades.service';
import { ListadoFacultadesComponent } from './listado-facultades.component';

interface FacultadesServiceMock {
  listarFacultades: ReturnType<
    typeof vi.fn<(filtros?: FiltrosFacultades) => Observable<RespuestaListadoFacultades>>
  >;
  cambiarEstadoFacultad: ReturnType<
    typeof vi.fn<
      (
        idFacultad: number,
        solicitud: { activo: boolean },
      ) => Observable<RespuestaCambioEstadoFacultad>
    >
  >;
}

describe('ListadoFacultadesComponent', () => {
  let fixture: ComponentFixture<ListadoFacultadesComponent>;
  let componente: ListadoFacultadesComponent;
  let facultadesService: FacultadesServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let solicitudesFacultades: Subject<RespuestaListadoFacultades>[];

  beforeEach(async () => {
    solicitudesFacultades = [];
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    facultadesService = {
      listarFacultades: vi.fn(() => {
        const solicitud = new Subject<RespuestaListadoFacultades>();
        solicitudesFacultades.push(solicitud);
        return solicitud.asObservable();
      }),
      cambiarEstadoFacultad: vi.fn(() =>
        respuestaObservable(
          crearRespuestaCambioEstado({ activo: false, id: 1 }),
        ),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoFacultadesComponent],
      providers: [
        provideRouter([]),
        {
          provide: FacultadesService,
          useValue: facultadesService,
        },
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoFacultadesComponent);
    componente = fixture.componentInstance;
  });

  it('carga facultades al iniciar', () => {
    iniciarYCompletar();

    expect(facultadesService.listarFacultades).toHaveBeenCalledTimes(1);
    expect(obtenerUltimosFiltros()).toEqual({
      codigo: undefined,
      nombre: undefined,
      activo: undefined,
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Sistemas');
    expect(obtenerTexto()).toContain('Medicina');
  });

  it('muestra estado vacío', () => {
    iniciarComponente();
    completarFacultades(crearRespuestaListado({ data: [] }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('No se encontraron facultades');
  });

  it('muestra estado vacío contextual por filtros', () => {
    iniciarYCompletar();
    componente.filtros.controls.activo.setValue('true');
    fixture.detectChanges();
    completarFacultades(crearRespuestaListado({ data: [] }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'No se encontraron facultades con los filtros aplicados.',
    );
    expect(obtenerBoton('Limpiar filtros')).toBeTruthy();
  });

  it('muestra error de API', () => {
    iniciarComponente();
    solicitudesFacultades[0].error(new HttpErrorResponse({ status: 0 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
  });

  it('envía filtros soportados por el backend', () => {
    iniciarYCompletar();
    facultadesService.listarFacultades.mockClear();

    componente.filtros.controls.codigo.setValue('sis');
    componente.filtros.controls.nombre.setValue('Ingeniería');
    componente.filtros.controls.activo.setValue('true');
    componente.buscarFacultades();

    expect(obtenerUltimosFiltros()).toEqual({
      codigo: 'sis',
      nombre: 'Ingeniería',
      activo: true,
      pagina: 1,
      limite: 10,
    });
  });

  it('rechaza filtros inválidos antes de consultar la API', () => {
    iniciarYCompletar();
    facultadesService.listarFacultades.mockClear();

    componente.filtros.controls.codigo.setValue('123456789012345678901');
    componente.buscarFacultades();
    fixture.detectChanges();

    expect(facultadesService.listarFacultades).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a la primera página', () => {
    iniciarYCompletar();
    facultadesService.listarFacultades.mockClear();

    componente.filtros.controls.codigo.setValue('sis');
    componente.cambiarPagina(2);
    componente.limpiarFiltros();

    expect(obtenerUltimosFiltros()).toEqual({
      codigo: undefined,
      nombre: undefined,
      activo: undefined,
      pagina: 1,
      limite: 10,
    });
  });

  it('cambia de página usando la paginación compartida', () => {
    iniciarYCompletar();
    facultadesService.listarFacultades.mockClear();

    componente.cambiarPagina(2);

    expect(obtenerUltimosFiltros()).toEqual({
      codigo: undefined,
      nombre: undefined,
      activo: undefined,
      pagina: 2,
      limite: 10,
    });
  });

  it('ADMIN ve acciones administrativas', () => {
    iniciarYCompletar();

    expect(obtenerEnlace('Nueva facultad')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Desactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));
    iniciarYCompletar();

    expect(obtenerEnlace('Nueva facultad')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Desactivar')).toBeNull();
  });

  it('enlaza cada facultad con su detalle y edición', () => {
    iniciarYCompletar();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/facultades/1');
    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/facultades/editar/1',
    );
  });

  it('confirma antes de cambiar estado y actualiza la fila', () => {
    iniciarYCompletar();
    componente.cambiarEstado(componente.facultades()[0]);
    fixture.detectChanges();

    expect(obtenerBoton('Confirmar')).toBeTruthy();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(facultadesService.cambiarEstadoFacultad).toHaveBeenCalledWith(1, {
      activo: false,
    });
    expect(componente.facultades()[0].activo).toBe(false);
    expect(obtenerTexto()).toContain(
      'Estado de facultad actualizado correctamente.',
    );
  });

  it('no cambia estado si se cancela la confirmación', () => {
    iniciarYCompletar();
    componente.cambiarEstado(componente.facultades()[0]);
    fixture.detectChanges();

    obtenerBoton('Cancelar')?.click();
    fixture.detectChanges();

    expect(facultadesService.cambiarEstadoFacultad).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al cambiar estado', () => {
    const solicitudPendiente = new Subject<RespuestaCambioEstadoFacultad>();

    facultadesService.cambiarEstadoFacultad.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    iniciarYCompletar();
    componente.cambiarEstado(componente.facultades()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();

    expect(facultadesService.cambiarEstadoFacultad).toHaveBeenCalledTimes(1);
  });

  it('muestra conflicto por carreras activas al desactivar', () => {
    facultadesService.cambiarEstadoFacultad.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'FACULTAD_HAS_ACTIVE_CARRERAS',
          message: 'Tiene carreras.',
        },
      })),
    );

    iniciarYCompletar();
    componente.cambiarEstado(componente.facultades()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(componente.mensajeError()).toBe(
      'No puede desactivar una facultad con carreras activas.',
    );
  });

  it('ignora los resultados de una consulta anterior', () => {
    iniciarComponente();
    const consultaAnterior = solicitudesFacultades[0];
    const consultaNueva = new Subject<RespuestaListadoFacultades>();
    facultadesService.listarFacultades.mockImplementationOnce(
      () => consultaNueva.asObservable(),
    );

    componente.cargarFacultades();

    expect(facultadesService.listarFacultades).toHaveBeenCalledTimes(2);

    consultaNueva.next(crearRespuestaListado({ data: [crearFacultad({ id: 77 })] }));
    consultaNueva.complete();
    consultaAnterior.next(crearRespuestaListado({ data: [crearFacultad({ id: 1 })] }));
    consultaAnterior.complete();

    expect(componente.facultades()[0]?.id).toBe(77);
  });

  it('al cambiar el estado consulta de inmediato', () => {
    iniciarYCompletar();
    facultadesService.listarFacultades.mockClear();

    componente.filtros.controls.activo.setValue('true');

    expect(facultadesService.listarFacultades).toHaveBeenCalledTimes(1);
    expect(obtenerUltimosFiltros()).toMatchObject({
      activo: true,
      pagina: 1,
      limite: 10,
    });
  });

  it('la busqueda por texto usa debounce', () => {
    vi.useFakeTimers();
    try {
      iniciarYCompletar();
      facultadesService.listarFacultades.mockClear();

      componente.filtros.controls.nombre.setValue('Sis');
      vi.advanceTimersByTime(100);
      expect(facultadesService.listarFacultades).not.toHaveBeenCalled();

      componente.filtros.controls.nombre.setValue('Sistemas');
      vi.advanceTimersByTime(400);

      expect(facultadesService.listarFacultades).toHaveBeenCalledTimes(1);
      expect(obtenerUltimosFiltros()).toMatchObject({
        nombre: 'Sistemas',
        pagina: 1,
        limite: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('cuenta los filtros activos', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(0);
    expect(obtenerTexto()).toContain('Filtros activos: 0');

    componente.filtros.controls.activo.setValue('true');
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(1);
    expect(obtenerTexto()).toContain('Filtros activos: 1');
  });

  it('no existe boton Buscar', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  it('selecciona y deselecciona una fila con clic', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];

    clicEnFila(primera);
    expect(componente.filaSeleccionada()?.id).toBe(primera.id);

    clicEnFila(primera);
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('selecciona la fila con Enter o Espacio', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];

    teclaEnFila(primera, 'Enter');
    expect(componente.filaSeleccionada()?.id).toBe(primera.id);

    teclaEnFila(primera, ' ');
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('no selecciona al pulsar un enlace o botón interno', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];
    const enlace = obtenerEnlace('Ver');

    componente.seleccionarFila(
      { target: enlace } as unknown as Event,
      primera,
    );

    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('el checkbox interno alterna la selección una sola vez', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];

    obtenerCheckboxSeleccion(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(componente.filaSeleccionada()?.id).toBe(primera.id);

    obtenerCheckboxSeleccion(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('muestra la barra contextual con las acciones válidas al seleccionar', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];

    clicEnFila(primera);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('1 registro seleccionado');
    expect(obtenerBoton('Ver')).toBeTruthy();
    expect(obtenerBoton('Editar')).toBeTruthy();
    expect(obtenerBoton('Desactivar')).toBeTruthy();
  });

  it('no muestra acciones no permitidas en la barra contextual', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));
    iniciarYCompletar();
    const primera = componente.facultades()[0];

    clicEnFila(primera);
    fixture.detectChanges();

    expect(obtenerBoton('Editar')).toBeNull();
    expect(obtenerBoton('Desactivar')).toBeNull();
    expect(obtenerBoton('Ver')).toBeTruthy();
  });

  it('marca visualmente la fila seleccionada', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];

    clicEnFila(primera);
    fixture.detectChanges();

    expect(obtenerFila(primera).classList.contains('fila-seleccionada')).toBe(
      true,
    );
  });

  it('limpia la selección al paginar', () => {
    iniciarYCompletar();
    const primera = componente.facultades()[0];
    clicEnFila(primera);

    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.filaSeleccionada()).toBeNull();
  });

  function clicEnFila(facultad: Facultad): void {
    const celda = obtenerFila(facultad).querySelector(
      'td:not(.columna-seleccion)',
    );

    celda?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function teclaEnFila(facultad: Facultad, tecla: string): void {
    obtenerFila(facultad).dispatchEvent(
      new KeyboardEvent('keydown', { key: tecla, bubbles: true }),
    );
  }

  function obtenerFila(facultad: Facultad): HTMLTableRowElement {
    const filas = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr'),
    ) as HTMLTableRowElement[];

    const fila = filas.find(
      (filaEncontrada) => filaEncontrada.textContent?.includes(facultad.codigo),
    );

    if (!fila) {
      throw new Error('No se encontró la fila de la facultad');
    }

    return fila;
  }

  function obtenerCheckboxSeleccion(indice: number): HTMLInputElement | null {
    const checkboxes = Array.from(
      fixture.nativeElement.querySelectorAll(
        'tbody tr .columna-seleccion input[type="checkbox"]',
      ),
    ) as HTMLInputElement[];

    return checkboxes[indice] ?? null;
  }

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarYCompletar(respuesta = crearRespuestaListado()): void {
    iniciarComponente();
    completarFacultades(respuesta);
    fixture.detectChanges();
  }

  function completarFacultades(respuesta = crearRespuestaListado()): void {
    solicitudesFacultades[solicitudesFacultades.length - 1].next(respuesta);
    solicitudesFacultades[solicitudesFacultades.length - 1].complete();
  }

  function obtenerUltimosFiltros(): FiltrosFacultades | undefined {
    const llamadas = facultadesService.listarFacultades.mock.calls;

    return llamadas[llamadas.length - 1]?.[0];
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null;
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
  }
});

function respuestaObservable<T>(valor: T): Observable<T> {
  return new Observable<T>((suscriptor) => {
    suscriptor.next(valor);
    suscriptor.complete();
  });
}

function errorObservable(error: unknown): Observable<never> {
  return new Observable<never>((suscriptor) => {
    suscriptor.error(error);
  });
}

function crearUsuario(codigoRol: string): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'activo',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

function crearFacultad(cambios: Partial<Facultad> = {}): Facultad {
  return {
    id: 1,
    codigo: 'SIS',
    nombre: 'Sistemas',
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...cambios,
  };
}

function crearRespuestaListado(
  parcial: Partial<RespuestaListadoFacultades> = {},
): RespuestaListadoFacultades {
  return {
    success: true,
    data: [
      crearFacultad({ id: 1, codigo: 'SIS', nombre: 'Sistemas' }),
      crearFacultad({ id: 2, codigo: 'MED', nombre: 'Medicina' }),
    ],
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
    ...parcial,
  };
}

function crearRespuestaCambioEstado(
  cambios: Partial<Facultad>,
): RespuestaCambioEstadoFacultad {
  return {
    success: true,
    message: 'Estado de facultad actualizado correctamente.',
    data: crearFacultad({ id: 1, ...cambios }),
  };
}