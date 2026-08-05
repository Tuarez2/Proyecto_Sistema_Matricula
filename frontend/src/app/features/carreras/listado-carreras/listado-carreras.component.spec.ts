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
  RespuestaCambioEstadoCarrera,
  RespuestaListadoCarreras,
} from '../models/carrera.model';
import { CarrerasService } from '../services/carreras.service';
import { ListadoCarrerasComponent } from './listado-carreras.component';

interface CarrerasServiceMock {
  listarCarreras: ReturnType<
    typeof vi.fn<() => Observable<RespuestaListadoCarreras>>
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

  it('carga carreras y facultades al iniciar', () => {
    crearComponente();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(facultadesService.listarFacultades).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(obtenerTexto()).toContain('Software');
    expect(obtenerTexto()).toContain('Medicina');
    expect(obtenerTexto()).toContain('SIS - Sistemas');
    expect(obtenerTexto()).toContain('MED - Medicina');
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarreras([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron carreras.');
  });

  it('muestra error de API al cargar carreras', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
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

  it('filtra localmente por código, nombre, facultad y estado', () => {
    crearComponente();

    componente.filtros.controls.codigo.setValue('sof');
    componente.filtros.controls.nombre.setValue('soft');
    componente.filtros.controls.facultad_id.setValue('2');
    componente.filtros.controls.activo.setValue('true');
    componente.buscarCarreras();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(obtenerTexto()).toContain('Software');
    expect(componente.carrerasPagina()).toEqual([
      expect.objectContaining({ nombre: 'Software' }),
    ]);
  });

  it('rechaza filtros inválidos sin volver a consultar la API', () => {
    crearComponente();
    carrerasService.listarCarreras.mockClear();

    componente.filtros.controls.nombre.setValue('x'.repeat(151));
    componente.buscarCarreras();
    fixture.detectChanges();

    expect(carrerasService.listarCarreras).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a mostrar todos los registros', () => {
    crearComponente();

    componente.filtros.controls.nombre.setValue('Software');
    componente.buscarCarreras();
    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Software');
    expect(obtenerTexto()).toContain('Medicina');
  });

  it('pagina localmente cuando el backend devuelve todos los registros', () => {
    carrerasService.listarCarreras.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarreras(
        Array.from({ length: 11 }, (_, indice) =>
          crearCarrera({
            id: indice + 1,
            codigo: `CAR${indice + 1}`,
            nombre: `Carrera ${indice + 1}`,
          }),
        ),
      )),
    );

    crearComponente();
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.carrerasPagina().length).toBe(1);
    expect(obtenerTexto()).toContain('Carrera 11');
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Crear carrera')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Crear carrera')).toBeNull();
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

  it('confirma antes de inactivar una carrera', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(carrerasService.inactivarCarrera).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Carrera inactivada correctamente.');
    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(2);
  });

  it('no inactiva si se cancela la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);

    expect(carrerasService.inactivarCarrera).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al inactivar', () => {
    const solicitudPendiente = new Subject<RespuestaCambioEstadoCarrera>();

    carrerasService.inactivarCarrera.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);
    componente.inactivarCarrera(componente.carreras()[1]);

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
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarCarrera(componente.carreras()[0]);

    expect(componente.mensajeError()).toBe('La carrera tiene relaciones activas.');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListadoCarrerasComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
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

function crearRespuestaCarreras(carreras: Carrera[]): RespuestaListadoCarreras {
  return {
    success: true,
    data: carreras,
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
