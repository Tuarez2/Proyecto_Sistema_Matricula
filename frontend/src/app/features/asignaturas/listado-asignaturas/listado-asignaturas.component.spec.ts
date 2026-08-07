import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  Asignatura,
  FiltrosAsignaturas,
  RespuestaCambioEstadoAsignatura,
  RespuestaListadoAsignaturas,
} from '../models/asignatura.model';
import { AsignaturasService } from '../services/asignaturas.service';
import { ListadoAsignaturasComponent } from './listado-asignaturas.component';

interface AsignaturasServiceMock {
  listarAsignaturas: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosAsignaturas) => Observable<RespuestaListadoAsignaturas>
    >
  >;
  inactivarAsignatura: ReturnType<
    typeof vi.fn<
      (idAsignatura: number) => Observable<RespuestaCambioEstadoAsignatura>
    >
  >;
}

describe('ListadoAsignaturasComponent', () => {
  let fixture: ComponentFixture<ListadoAsignaturasComponent>;
  let componente: ListadoAsignaturasComponent;
  let asignaturasService: AsignaturasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    asignaturasService = {
      listarAsignaturas: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignaturas([
            crearAsignatura({ id: 1, codigo: 'PRG1', nombre: 'Programación I' }),
            crearAsignatura({
              id: 2,
              codigo: 'MATE1',
              nombre: 'Matemática I',
              creditos: 3,
              nivel_academico: 1,
            }),
          ]),
        ),
      ),
      inactivarAsignatura: vi.fn(() =>
        respuestaObservable(crearRespuestaCambioEstado({ activo: false })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoAsignaturasComponent],
      providers: [
        provideRouter([]),
        {
          provide: AsignaturasService,
          useValue: asignaturasService,
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

  it('solicita la primera página con límite explícito al iniciar', () => {
    crearComponente();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('Matemática I');
  });

  it('usa total y totalPages de la respuesta del backend', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaAsignaturas([crearAsignatura()], {
          total: 25,
          totalPages: 3,
        }),
      ),
    );

    crearComponente();

    expect(componente.totalAsignaturas()).toBe(25);
    expect(componente.totalPaginas()).toBe(3);
  });

  it('cambia de página solicitando los datos al backend sin paginar en memoria', () => {
    const paginaUno = crearRespuestaAsignaturas(
      Array.from({ length: 10 }, (_, indice) =>
        crearAsignatura({
          id: indice + 1,
          codigo: `ASG${indice + 1}`,
          nombre: `Asignatura ${indice + 1}`,
        })),
      { page: 1, limit: 10, total: 11, totalPages: 2 },
    );
    const paginaDos = crearRespuestaAsignaturas(
      [crearAsignatura({ id: 11, codigo: 'ASG11', nombre: 'Asignatura 11' })],
      { page: 2, limit: 10, total: 11, totalPages: 2 },
    );

    asignaturasService.listarAsignaturas
      .mockReturnValueOnce(respuestaObservable(paginaUno))
      .mockReturnValueOnce(respuestaObservable(paginaDos));

    crearComponente();
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(2);
    expect(asignaturasService.listarAsignaturas).toHaveBeenLastCalledWith({
      pagina: 2,
      limite: 10,
    });
    expect(componente.paginaActual()).toBe(2);
    expect(componente.asignaturas()).toHaveLength(1);
    expect(obtenerTexto()).toContain('Asignatura 11');
  });

  it('aplica filtros al backend y restablece a la página 1', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.codigo.setValue('PRG');
    componente.filtros.controls.nombre.setValue('Programación');
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      codigo: 'PRG',
      nombre: 'Programación',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de créditos', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.creditos.setValue('4');
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      creditos: 4,
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de nivel académico', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.nivel_academico.setValue('2');
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      nivel_academico: 2,
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de estado activo', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.activo.setValue('false');
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      activo: false,
      pagina: 1,
      limite: 10,
    });
  });

  it('rechaza filtros inválidos sin volver a consultar la API', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.nombre.setValue('x'.repeat(151));
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a consultar desde la página 1 sin filtros', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.nombre.setValue('Programación I');
    componente.buscarAsignaturas();
    asignaturasService.listarAsignaturas.mockClear();

    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('Matemática I');
  });

  it('no filtra ni pagina localmente los registros devueltos por el backend', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaAsignaturas(
          Array.from({ length: 11 }, (_, indice) =>
            crearAsignatura({
              id: indice + 1,
              codigo: `ASG${indice + 1}`,
              nombre: `Asignatura ${indice + 1}`,
            })),
          { page: 1, limit: 10, total: 11, totalPages: 2 },
        ),
      ),
    );

    crearComponente();

    expect(componente.asignaturas()).toHaveLength(11);
    expect(componente.totalAsignaturas()).toBe(11);
    expect(componente.totalPaginas()).toBe(2);
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      respuestaObservable(crearRespuestaAsignaturas([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron asignaturas');
  });

  it('muestra error de API al cargar asignaturas', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('limpia los resultados anteriores si falla una carga posterior', () => {
    crearComponente();

    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.asignaturas()).toEqual([]);
    expect(obtenerTexto()).not.toContain('Programación I');
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Nueva asignatura')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Nueva asignatura')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('enlaza cada asignatura con detalle y edición', () => {
    crearComponente();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/asignaturas/1');
    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/asignaturas/editar/1',
    );
  });

  it('confirma antes de inactivar una asignatura y recarga la página actual', () => {
    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);
    fixture.detectChanges();

    expect(obtenerBoton('Confirmar')).toBeTruthy();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(asignaturasService.inactivarAsignatura).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Asignatura inactivada correctamente.');
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(2);
    expect(asignaturasService.listarAsignaturas).toHaveBeenLastCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('no inactiva si se cancela la confirmación', () => {
    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);
    fixture.detectChanges();

    obtenerBoton('Cancelar')?.click();
    fixture.detectChanges();

    expect(asignaturasService.inactivarAsignatura).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al inactivar', () => {
    const solicitudPendiente =
      new Subject<RespuestaCambioEstadoAsignatura>();

    asignaturasService.inactivarAsignatura.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();

    expect(asignaturasService.inactivarAsignatura).toHaveBeenCalledTimes(1);
  });

  it('muestra error de operación al inactivar', () => {
    asignaturasService.inactivarAsignatura.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 409,
          error: {
            success: false,
            code: 'UNIQUE_CONSTRAINT_ERROR',
            message: 'El registro ya existe.',
          },
        }),
      ),
    );

    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(componente.mensajeError()).toBe(
      'El código de asignatura ya está registrado.',
    );
  });

  it('la busqueda por texto usa debounce', () => {
    vi.useFakeTimers();
    try {
      crearComponente();
      asignaturasService.listarAsignaturas.mockClear();

      componente.filtros.controls.nombre.setValue('Prog');
      vi.advanceTimersByTime(100);
      expect(asignaturasService.listarAsignaturas).not.toHaveBeenCalled();

      componente.filtros.controls.nombre.setValue('Programación');
      vi.advanceTimersByTime(400);

      expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
      expect(obtenerUltimosFiltros()).toMatchObject({
        nombre: 'Programación',
        pagina: 1,
        limite: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('al cambiar el filtro activo consulta de inmediato', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.activo.setValue('false');

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(obtenerUltimosFiltros()).toMatchObject({
      activo: false,
      pagina: 1,
      limite: 10,
    });
  });

  it('cuenta los filtros activos', () => {
    crearComponente();
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(0);
    expect(obtenerTexto()).toContain('Filtros activos: 0');

    componente.filtros.controls.activo.setValue('false');
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
    fixture = TestBed.createComponent(ListadoAsignaturasComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerUltimosFiltros(): FiltrosAsignaturas | undefined {
    const llamadas = asignaturasService.listarAsignaturas.mock.calls;

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

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 1,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...cambios,
  };
}

function crearRespuestaAsignaturas(
  asignaturas: Asignatura[],
  paginacion: Partial<RespuestaListadoAsignaturas> = {},
): RespuestaListadoAsignaturas {
  return {
    success: true,
    data: asignaturas,
    page: 1,
    limit: 10,
    total: asignaturas.length,
    totalPages: Math.ceil(asignaturas.length / 10),
    ...paginacion,
  };
}

function crearRespuestaCambioEstado(
  cambios: Partial<Asignatura>,
): RespuestaCambioEstadoAsignatura {
  return {
    success: true,
    message: 'Asignatura inactivada correctamente.',
    data: crearAsignatura({ id: 1, ...cambios }),
  };
}
