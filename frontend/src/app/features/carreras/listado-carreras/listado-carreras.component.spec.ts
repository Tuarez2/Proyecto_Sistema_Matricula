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
  RespuestaListadoFacultades,
} from '../../facultades/models/facultad.model';
import { FacultadesService } from '../../facultades/services/facultades.service';
import type {
  Carrera,
  FiltrosCarreras,
  RespuestaCambioEstadoCarrera,
  RespuestaListadoCarreras,
} from '../models/carrera.model';
import { CarrerasService } from '../services/carreras.service';
import { ListadoCarrerasComponent } from './listado-carreras.component';

interface CarrerasServiceMock {
  listarCarreras: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosCarreras) => Observable<RespuestaListadoCarreras>
    >
  >;
  inactivarCarrera: ReturnType<
    typeof vi.fn<(idCarrera: number) => Observable<RespuestaCambioEstadoCarrera>>
  >;
}

interface FacultadesServiceMock {
  listarFacultades: ReturnType<
    typeof vi.fn<() => Observable<RespuestaListadoFacultades>>
  >;
}

describe('ListadoCarrerasComponent', () => {
  let fixture: ComponentFixture<ListadoCarrerasComponent>;
  let componente: ListadoCarrerasComponent;
  let carrerasService: CarrerasServiceMock;
  let facultadesService: FacultadesServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    carrerasService = {
      listarCarreras: vi.fn(() =>
        respuestaObservable(crearRespuestaCarreras([
          crearCarrera({ id: 1, codigo: 'SOF', nombre: 'Software' }),
          crearCarrera({
            id: 2,
            codigo: 'MED',
            nombre: 'Medicina',
            duracion_semestres: 10,
            facultad_id: 3,
            facultad: null,
          }),
        ])),
      ),
      inactivarCarrera: vi.fn(() =>
        respuestaObservable(crearRespuestaCambioEstado({ activo: false })),
      ),
    };
    facultadesService = {
      listarFacultades: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultades()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoCarrerasComponent],
      providers: [
        provideRouter([]),
        {
          provide: CarrerasService,
          useValue: carrerasService,
        },
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
  });

  it('carga la primera página y las facultades al iniciar', () => {
    crearComponente();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(facultadesService.listarFacultades).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(obtenerTexto()).toContain('Software');
    expect(obtenerTexto()).toContain('Medicina');
    expect(obtenerTexto()).toContain('SIS - Sistemas');
    expect(obtenerTexto()).toContain('MED - Medicina');
  });

  it('usa total y totalPages de la respuesta del backend', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarreras([crearCarrera()], {
        total: 25,
        totalPages: 3,
      })),
    );

    crearComponente();

    expect(componente.totalCarreras()).toBe(25);
    expect(componente.totalPaginas()).toBe(3);
  });

  it('cambia de página solicitando los datos al backend sin paginar en memoria', () => {
    const paginaUno = crearRespuestaCarreras(
      Array.from({ length: 10 }, (_, indice) =>
        crearCarrera({
          id: indice + 1,
          codigo: `CAR${indice + 1}`,
          nombre: `Carrera ${indice + 1}`,
        })),
      { page: 1, limit: 10, total: 11, totalPages: 2 },
    );
    const paginaDos = crearRespuestaCarreras(
      [crearCarrera({ id: 11, codigo: 'CAR11', nombre: 'Carrera 11' })],
      { page: 2, limit: 10, total: 11, totalPages: 2 },
    );

    carrerasService.listarCarreras
      .mockReturnValueOnce(respuestaObservable(paginaUno))
      .mockReturnValueOnce(respuestaObservable(paginaDos));

    crearComponente();
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(2);
    expect(carrerasService.listarCarreras).toHaveBeenLastCalledWith({
      pagina: 2,
      limite: 10,
    });
    expect(componente.paginaActual()).toBe(2);
    expect(componente.carreras()).toHaveLength(1);
    expect(obtenerTexto()).toContain('Carrera 11');
  });

  it('aplica filtros al backend y restablece a la página 1', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.codigo.setValue('SOF', { emitEvent: false });
    componente.filtros.controls.nombre.setValue('Software', { emitEvent: false });
    componente.buscarCarreras();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      codigo: 'SOF',
      nombre: 'Software',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de facultad como facultad_id', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.facultad_id.setValue('2', { emitEvent: false });
    componente.buscarCarreras();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      facultad_id: 2,
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de estado activo', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.activo.setValue('false', { emitEvent: false });
    componente.buscarCarreras();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      activo: false,
      pagina: 1,
      limite: 10,
    });
  });

  it('rechaza filtros inválidos sin volver a consultar la API', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.nombre.setValue('x'.repeat(151), { emitEvent: false });
    componente.buscarCarreras();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a consultar desde la página 1 sin filtros', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.nombre.setValue('Software', { emitEvent: false });
    componente.buscarCarreras();
    carrerasService.listarCarreras.mockClear();

    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Software');
    expect(obtenerTexto()).toContain('Medicina');
  });

  it('no pagina ni filtra localmente los registros devueltos por el backend', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarreras(
        Array.from({ length: 11 }, (_, indice) =>
          crearCarrera({
            id: indice + 1,
            codigo: `CAR${indice + 1}`,
            nombre: `Carrera ${indice + 1}`,
          })),
        { page: 1, limit: 10, total: 11, totalPages: 2 },
      )),
    );

    crearComponente();

    expect(componente.carreras()).toHaveLength(11);
    expect(componente.totalCarreras()).toBe(11);
    expect(componente.totalPaginas()).toBe(2);
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarreras([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron carreras');
  });

  it('muestra error de API al cargar carreras', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
  });

  it('limpia los resultados anteriores si falla una carga posterior', () => {
    crearComponente();

    carrerasService.listarCarreras.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.carreras()).toEqual([]);
    expect(obtenerTexto()).not.toContain('Software');
  });

  it('muestra error cuando falla el catálogo de facultades', () => {
    facultadesService.listarFacultades.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 500 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible cargar el catálogo de facultades.',
    );
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Nueva carrera')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Nueva carrera')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('enlaza cada carrera con detalle y edición', () => {
    crearComponente();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/carreras/1');
    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/carreras/editar/1',
    );
  });

  it('confirma antes de inactivar una carrera y recarga la página actual', () => {
    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);
    fixture.detectChanges();

    expect(obtenerBoton('Confirmar')).toBeTruthy();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(carrerasService.inactivarCarrera).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Carrera inactivada correctamente.');
    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(2);
    expect(carrerasService.listarCarreras).toHaveBeenLastCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('no inactiva si se cancela la confirmación', () => {
    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);
    fixture.detectChanges();

    obtenerBoton('Cancelar')?.click();
    fixture.detectChanges();

    expect(carrerasService.inactivarCarrera).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al inactivar', () => {
    const solicitudPendiente = new Subject<RespuestaCambioEstadoCarrera>();

    carrerasService.inactivarCarrera.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();

    expect(carrerasService.inactivarCarrera).toHaveBeenCalledTimes(1);
  });

  it('muestra error de operación al inactivar', () => {
    carrerasService.inactivarCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'RELACION_ACTIVA',
          message: 'La carrera tiene relaciones activas.',
        },
      })),
    );

    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(componente.mensajeError()).toBe('La carrera tiene relaciones activas.');
  });

  it('ignora resultados de una consulta anterior', () => {
    const consultaAnterior = new Subject<RespuestaListadoCarreras>();
    const consultaNueva = new Subject<RespuestaListadoCarreras>();

    carrerasService.listarCarreras
      .mockReturnValueOnce(consultaAnterior.asObservable())
      .mockReturnValueOnce(consultaNueva.asObservable());

    crearComponente();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);

    componente.cargarCarreras();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(2);

    consultaNueva.next(crearRespuestaCarreras([crearCarrera({ id: 77 })]));
    consultaNueva.complete();
    consultaAnterior.next(crearRespuestaCarreras([crearCarrera({ id: 1 })]));
    consultaAnterior.complete();

    expect(componente.carreras()[0]?.id).toBe(77);
  });

  it('al cambiar el filtro de facultad consulta de inmediato', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.facultad_id.setValue('2');

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(obtenerUltimosFiltros()).toMatchObject({
      facultad_id: 2,
      pagina: 1,
      limite: 10,
    });
  });

  it('la busqueda por texto usa debounce', () => {
    vi.useFakeTimers();
    try {
      crearComponente();
      carrerasService.listarCarreras.mockClear();

      componente.filtros.controls.nombre.setValue('So');
      vi.advanceTimersByTime(100);
      expect(carrerasService.listarCarreras).not.toHaveBeenCalled();

      componente.filtros.controls.nombre.setValue('Soft');
      vi.advanceTimersByTime(400);

      expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
      expect(obtenerUltimosFiltros()).toMatchObject({
        nombre: 'Soft',
        pagina: 1,
        limite: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('cuenta los filtros activos', () => {
    crearComponente();
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(0);
    expect(obtenerTexto()).toContain('Filtros activos: 0');

    componente.filtros.controls.facultad_id.setValue('2');
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(1);
    expect(obtenerTexto()).toContain('Filtros activos: 1');
  });

  it('no existe boton Buscar', () => {
    crearComponente();
    fixture.detectChanges();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListadoCarrerasComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function obtenerUltimosFiltros(): FiltrosCarreras | undefined {
    const llamadas = carrerasService.listarCarreras.mock.calls;

    return llamadas[llamadas.length - 1]?.[0];
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

function crearCarrera(cambios: Partial<Carrera> = {}): Carrera {
  return {
    id: 1,
    codigo: 'SOF',
    nombre: 'Software',
    duracion_semestres: 8,
    facultad_id: 2,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    facultad: {
      id: 2,
      codigo: 'SIS',
      nombre: 'Sistemas',
      activo: true,
    },
    ...cambios,
  };
}

function crearFacultad(cambios: Partial<Facultad> = {}): Facultad {
  return {
    id: 2,
    codigo: 'SIS',
    nombre: 'Sistemas',
    activo: true,
    ...cambios,
  };
}

function crearRespuestaCarreras(
  carreras: Carrera[],
  paginacion: Partial<RespuestaListadoCarreras> = {},
): RespuestaListadoCarreras {
  return {
    success: true,
    data: carreras,
    page: 1,
    limit: 10,
    total: carreras.length,
    totalPages: Math.ceil(carreras.length / 10),
    ...paginacion,
  };
}

function crearRespuestaFacultades(): RespuestaListadoFacultades {
  return {
    success: true,
    data: [
      crearFacultad(),
      crearFacultad({ id: 3, codigo: 'MED', nombre: 'Medicina' }),
    ],
    page: 1,
    limit: 100,
    total: 2,
    totalPages: 1,
  };
}

function crearRespuestaCambioEstado(
  cambios: Partial<Carrera>,
): RespuestaCambioEstadoCarrera {
  return {
    success: true,
    message: 'Carrera inactivada correctamente.',
    data: crearCarrera({ id: 1, ...cambios }),
  };
}
