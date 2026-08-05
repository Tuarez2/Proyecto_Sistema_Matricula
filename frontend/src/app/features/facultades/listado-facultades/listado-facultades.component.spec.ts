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

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    facultadesService = {
      listarFacultades: vi.fn(() =>
        respuestaObservable(crearRespuestaListado([
          crearFacultad({ id: 1, codigo: 'SIS', nombre: 'Sistemas' }),
          crearFacultad({ id: 2, codigo: 'MED', nombre: 'Medicina' }),
        ])),
      ),
      cambiarEstadoFacultad: vi.fn(() =>
        respuestaObservable(crearRespuestaCambioEstado({ activo: false })),
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
  });

  it('carga facultades al iniciar', () => {
    crearComponente();

    expect(facultadesService.listarFacultades).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
      codigo: undefined,
      nombre: undefined,
      activo: undefined,
    });
    expect(obtenerTexto()).toContain('Sistemas');
    expect(obtenerTexto()).toContain('Medicina');
  });

  it('muestra estado vacío', () => {
    facultadesService.listarFacultades.mockReturnValueOnce(
      respuestaObservable(crearRespuestaListado([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron facultades.');
  });

  it('muestra error de API', () => {
    facultadesService.listarFacultades.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
  });

  it('envía filtros soportados por el backend', () => {
    crearComponente();

    componente.filtros.controls.codigo.setValue('sis');
    componente.filtros.controls.nombre.setValue('Ingeniería');
    componente.filtros.controls.activo.setValue('true');
    componente.buscarFacultades();

    expect(facultadesService.listarFacultades).toHaveBeenLastCalledWith({
      codigo: 'sis',
      nombre: 'Ingeniería',
      activo: true,
      pagina: 1,
      limite: 10,
    });
  });

  it('rechaza filtros inválidos antes de consultar la API', () => {
    crearComponente();
    facultadesService.listarFacultades.mockClear();

    componente.filtros.controls.codigo.setValue('123456789012345678901');
    componente.buscarFacultades();
    fixture.detectChanges();

    expect(facultadesService.listarFacultades).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a la primera página', () => {
    crearComponente();

    componente.filtros.controls.codigo.setValue('sis');
    componente.cambiarPagina(2);
    componente.limpiarFiltros();

    expect(facultadesService.listarFacultades).toHaveBeenLastCalledWith({
      codigo: undefined,
      nombre: undefined,
      activo: undefined,
      pagina: 1,
      limite: 10,
    });
  });

  it('cambia de página usando la paginación compartida', () => {
    crearComponente();

    componente.cambiarPagina(2);

    expect(facultadesService.listarFacultades).toHaveBeenLastCalledWith({
      codigo: undefined,
      nombre: undefined,
      activo: undefined,
      pagina: 2,
      limite: 10,
    });
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Crear facultad')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Desactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Crear facultad')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Desactivar')).toBeNull();
  });

  it('enlaza cada facultad con su detalle y edición', () => {
    crearComponente();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/facultades/1');
    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/facultades/editar/1',
    );
  });

  it('confirma antes de cambiar estado y actualiza la fila', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstado(componente.facultades()[0]);
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(facultadesService.cambiarEstadoFacultad).toHaveBeenCalledWith(1, {
      activo: false,
    });
    expect(componente.facultades()[0].activo).toBe(false);
    expect(obtenerTexto()).toContain('Estado de facultad actualizado correctamente.');
  });

  it('no cambia estado si se cancela la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    componente.cambiarEstado(componente.facultades()[0]);

    expect(facultadesService.cambiarEstadoFacultad).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al cambiar estado', () => {
    const solicitudPendiente = new Subject<RespuestaCambioEstadoFacultad>();

    facultadesService.cambiarEstadoFacultad.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstado(componente.facultades()[0]);
    componente.cambiarEstado(componente.facultades()[1]);

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
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstado(componente.facultades()[0]);

    expect(componente.mensajeError()).toBe(
      'No puede desactivar una facultad con carreras activas.',
    );
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListadoFacultadesComponent);
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
  facultades: Facultad[],
): RespuestaListadoFacultades {
  return {
    success: true,
    data: facultades,
    page: 1,
    limit: 10,
    total: facultades.length,
    totalPages: 1,
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
