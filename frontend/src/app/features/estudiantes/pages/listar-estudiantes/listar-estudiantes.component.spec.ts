import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import type {
  Carrera,
  FiltrosCarreras,
  RespuestaListadoCarreras,
} from '../../../carreras/models/carrera.model';
import { CarrerasService } from '../../../carreras/services/carreras.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type FiltrosEstudiantes,
  type RespuestaEstudiante,
  type RespuestaListadoEstudiantes,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';
import { ListarEstudiantesComponent } from './listar-estudiantes.component';

interface EstudiantesServiceMock {
  listarEstudiantes: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosEstudiantes) => Observable<RespuestaListadoEstudiantes>
    >
  >;
  cambiarEstadoEstudiante: ReturnType<
    typeof vi.fn<(idEstudiante: number) => Observable<RespuestaEstudiante>>
  >;
}

interface CarrerasServiceMock {
  listarCarreras: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosCarreras) => Observable<RespuestaListadoCarreras>
    >
  >;
}

describe('ListarEstudiantesComponent', () => {
  let fixture: ComponentFixture<ListarEstudiantesComponent>;
  let componente: ListarEstudiantesComponent;
  let estudiantesService: EstudiantesServiceMock;
  let carrerasService: CarrerasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    estudiantesService = {
      listarEstudiantes: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiantes([
          crearEstudiante({ id: 1, nombres: 'Ana', identificacion: '111' }),
          crearEstudiante({ id: 2, nombres: 'Luis', identificacion: '222' }),
        ])),
      ),
      cambiarEstadoEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante({
          estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO,
        })),
      ),
    };
    carrerasService = {
      listarCarreras: vi.fn(() =>
        respuestaObservable(crearRespuestaCarreras([crearCarrera()])),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListarEstudiantesComponent],
      providers: [
        provideRouter([]),
        {
          provide: EstudiantesService,
          useValue: estudiantesService,
        },
        {
          provide: CarrerasService,
          useValue: carrerasService,
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

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('usa total y totalPages de la respuesta del backend', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaEstudiantes([crearEstudiante()], {
          total: 25,
          totalPages: 3,
        }),
      ),
    );

    crearComponente();

    expect(componente.totalEstudiantes()).toBe(25);
    expect(componente.totalPaginas()).toBe(3);
  });

  it('cambia de página solicitando los datos al backend sin paginar en memoria', () => {
    const paginaUno = crearRespuestaEstudiantes(
      Array.from({ length: 10 }, (_, indice) =>
        crearEstudiante({
          id: indice + 1,
          nombres: `Persona ${indice + 1}`,
          identificacion: String(indice + 1),
        })),
      { page: 1, limit: 10, total: 11, totalPages: 2 },
    );
    const paginaDos = crearRespuestaEstudiantes(
      [crearEstudiante({ id: 11, nombres: 'Persona 11' })],
      { page: 2, limit: 10, total: 11, totalPages: 2 },
    );

    estudiantesService.listarEstudiantes
      .mockReturnValueOnce(respuestaObservable(paginaUno))
      .mockReturnValueOnce(respuestaObservable(paginaDos));

    crearComponente();
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(2);
    expect(estudiantesService.listarEstudiantes).toHaveBeenLastCalledWith({
      pagina: 2,
      limite: 10,
    });
    expect(componente.paginaActual()).toBe(2);
    expect(componente.estudiantes()).toHaveLength(1);
    expect(obtenerTexto()).toContain('Persona 11 Vera');
  });

  it('aplica filtros al backend y restablece a la página 1', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.identificacion.setValue('1002');
    componente.filtros.controls.numero_matricula.setValue('EST');
    componente.filtros.controls.nombres.setValue('Ana');
    componente.filtros.controls.apellidos.setValue('Vera');
    componente.buscarEstudiantes();
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      identificacion: '1002',
      numero_matricula: 'EST',
      nombres: 'Ana',
      apellidos: 'Vera',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de carrera como carrera_id', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.carrera_id.setValue('2');
    componente.buscarEstudiantes();
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      carrera_id: 2,
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de estado académico en minúsculas', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.estado_academico.setValue(
      ESTADOS_ACADEMICOS_ESTUDIANTE.SUSPENDIDO,
    );
    componente.buscarEstudiantes();
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      estado_academico: 'suspendido',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de nivel académico actual', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.nivel_academico_actual.setValue('3');
    componente.buscarEstudiantes();
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      nivel_academico_actual: 3,
      pagina: 1,
      limite: 10,
    });
  });

  it('rechaza filtros inválidos sin volver a consultar la API', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.nombres.setValue('x'.repeat(101));
    componente.buscarEstudiantes();
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a consultar desde la página 1 sin filtros', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.identificacion.setValue('222');
    componente.buscarEstudiantes();
    estudiantesService.listarEstudiantes.mockClear();

    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('no filtra ni pagina localmente los registros devueltos por el backend', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaEstudiantes(
          Array.from({ length: 11 }, (_, indice) =>
            crearEstudiante({
              id: indice + 1,
              nombres: `Persona ${indice + 1}`,
              identificacion: String(indice + 1),
            })),
          { page: 1, limit: 10, total: 11, totalPages: 2 },
        ),
      ),
    );

    crearComponente();

    expect(componente.estudiantes()).toHaveLength(11);
    expect(componente.totalEstudiantes()).toBe(11);
    expect(componente.totalPaginas()).toBe(2);
  });

  it('muestra estado vacío general cuando no hay resultados ni filtros', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaEstudiantes([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron estudiantes.');
  });

  it('muestra error de API al cargar estudiantes', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('limpia los resultados anteriores si falla una carga posterior', () => {
    crearComponente();

    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.estudiantes()).toEqual([]);
    expect(obtenerTexto()).not.toContain('Ana Vera');
  });

  it('muestra las carreras del catálogo en el filtro', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Ingeniería de Software');
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Nuevo estudiante')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    crearComponente();

    expect(obtenerEnlace('Nuevo estudiante')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('todos los roles ven el enlace Ver', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));
    crearComponente();

    expect(obtenerEnlace('Ver')).toBeTruthy();
  });

  it('el enlace Ver apunta al detalle del estudiante', () => {
    crearComponente();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/estudiantes/1');
  });

  it('confirma antes de inactivar y recarga la página actual', () => {
    crearComponente();
    componente.inactivarEstudiante(componente.estudiantes()[0]);
    fixture.detectChanges();

    expect(obtenerBoton('Confirmar')).toBeTruthy();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(estudiantesService.cambiarEstadoEstudiante).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Estudiante inactivado correctamente.');
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(2);
    expect(estudiantesService.listarEstudiantes).toHaveBeenLastCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('no inactiva si el usuario cancela la confirmacion', () => {
    crearComponente();
    componente.inactivarEstudiante(componente.estudiantes()[0]);
    fixture.detectChanges();

    obtenerBoton('Cancelar')?.click();
    fixture.detectChanges();

    expect(estudiantesService.cambiarEstadoEstudiante).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas mientras procesa estado', () => {
    const solicitudPendiente = new Subject<RespuestaEstudiante>();

    estudiantesService.cambiarEstadoEstudiante.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.inactivarEstudiante(componente.estudiantes()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();

    expect(estudiantesService.cambiarEstadoEstudiante).toHaveBeenCalledTimes(1);
  });

  it('cambiar un selector consulta inmediatamente', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.carrera_id.setValue('2');

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      carrera_id: 2,
      pagina: 1,
      limite: 10,
    });
  });

  it('la busqueda de texto no consulta con cada tecla y aplica tras el debounce', () => {
    vi.useFakeTimers();
    try {
      crearComponente();
      estudiantesService.listarEstudiantes.mockClear();

      componente.filtros.controls.nombres.setValue('An');
      vi.advanceTimersByTime(100);

      expect(estudiantesService.listarEstudiantes).not.toHaveBeenCalled();

      componente.filtros.controls.nombres.setValue('Ana');
      vi.advanceTimersByTime(400);

      expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
      expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
        nombres: 'Ana',
        pagina: 1,
        limite: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('normaliza la busqueda con trim', () => {
    vi.useFakeTimers();
    try {
      crearComponente();
      estudiantesService.listarEstudiantes.mockClear();

      componente.filtros.controls.nombres.setValue('  Ana  ');
      vi.advanceTimersByTime(400);

      expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
        nombres: 'Ana',
        pagina: 1,
        limite: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('solo espacios en la busqueda no dispara una consulta redundante', () => {
    vi.useFakeTimers();
    try {
      crearComponente();
      estudiantesService.listarEstudiantes.mockClear();

      componente.filtros.controls.nombres.setValue('   ');
      vi.advanceTimersByTime(400);

      expect(estudiantesService.listarEstudiantes).not.toHaveBeenCalled();
      expect(componente.filtrosActivos()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('una consulta anterior no sobrescribe la mas reciente', () => {
    const primera = new Subject<RespuestaListadoEstudiantes>();
    const segunda = new Subject<RespuestaListadoEstudiantes>();

    estudiantesService.listarEstudiantes
      .mockReturnValueOnce(primera.asObservable())
      .mockReturnValueOnce(segunda.asObservable());

    crearComponente();
    componente.filtros.controls.estado_academico.setValue(
      ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO,
    );

    primera.next(crearRespuestaEstudiantes([crearEstudiante({ id: 50 })]));
    expect(componente.estudiantes()).toEqual([]);

    segunda.next(crearRespuestaEstudiantes([crearEstudiante({ id: 60 })]));
    expect(componente.estudiantes()[0]?.id).toBe(60);
  });

  it('una consulta cancelada no se presenta como error', () => {
    const primera = new Subject<RespuestaListadoEstudiantes>();
    const segunda = new Subject<RespuestaListadoEstudiantes>();

    estudiantesService.listarEstudiantes
      .mockReturnValueOnce(primera.asObservable())
      .mockReturnValueOnce(segunda.asObservable());

    crearComponente();
    componente.filtros.controls.carrera_id.setValue('2');

    expect(componente.mensajeError()).toBeNull();
    segunda.next(crearRespuestaEstudiantes([crearEstudiante({ id: 1 })]));
    expect(componente.mensajeError()).toBeNull();
  });

  it('cambiar un filtro reinicia a la página 1', () => {
    crearComponente();
    componente.cambiarPagina(3);
    estudiantesService.listarEstudiantes.mockClear();

    componente.filtros.controls.estado_academico.setValue(
      ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    );

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      estado_academico: 'activo',
      pagina: 1,
      limite: 10,
    });
  });

  it('cambiar de página conserva los filtros', () => {
    crearComponente();
    componente.filtros.controls.nombres.setValue('Ana');
    estudiantesService.listarEstudiantes.mockClear();

    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      nombres: 'Ana',
      pagina: 2,
      limite: 10,
    });
  });

  it('limpiar filtros vuelve a la página 1 y hace una sola consulta', () => {
    crearComponente();
    componente.filtros.controls.nombres.setValue('Ana');
    componente.filtros.controls.carrera_id.setValue('2');
    componente.cambiarPagina(3);
    estudiantesService.listarEstudiantes.mockClear();

    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(componente.paginaActual()).toBe(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('el indicador de filtros activos refleja el numero correcto', () => {
    crearComponente();
    expect(componente.filtrosActivos()).toBe(0);

    componente.filtros.controls.nombres.setValue('Ana');
    componente.filtros.controls.carrera_id.setValue('2');
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(2);

    componente.limpiarFiltros();
    expect(componente.filtrosActivos()).toBe(0);
  });

  it('muestra empty-state contextual con filtros y permite limpiar', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaEstudiantes([])),
    );
    crearComponente();
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaEstudiantes([])),
    );

    componente.filtros.controls.carrera_id.setValue('2');
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'No se encontraron estudiantes con los filtros aplicados.',
    );
    expect(obtenerBoton('Limpiar filtros')).toBeTruthy();
  });

  it('Enter no dispara una consulta duplicada', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockClear();

    const formulario = obtenerElemento<HTMLFormElement>('form');
    formulario?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(0);
  });

  it('el estado de carga se desactiva al finalizar', () => {
    crearComponente();

    expect(componente.cargandoEstudiantes()).toBe(false);
  });

  it('un error deja de cargar y conserva los filtros introducidos', () => {
    crearComponente();
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    componente.filtros.controls.estado_academico.setValue(
      ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO,
    );
    fixture.detectChanges();

    expect(componente.filtros.controls.estado_academico.value).toBe('inactivo');
    expect(componente.mensajeError()).toContain('No fue posible conectar');
    expect(componente.cargandoEstudiantes()).toBe(false);
  });

  it('no existen botones Buscar en el formulario de filtros', () => {
    crearComponente();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListarEstudiantesComponent);
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

  function obtenerElemento<T extends Element = Element>(
    selector: string,
  ): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
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

function crearEstudiante(cambios: Partial<Estudiante> = {}): Estudiante {
  return {
    id: 1,
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
    carrera: {
      id: 2,
      codigo: 'SIS',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: 1,
      activo: true,
    },
    ...cambios,
  };
}

function crearCarrera(cambios: Partial<Carrera> = {}): Carrera {
  return {
    id: 2,
    codigo: 'SIS',
    nombre: 'Ingeniería de Software',
    duracion_semestres: 8,
    facultad_id: 1,
    activo: true,
    ...cambios,
  };
}

function crearRespuestaEstudiantes(
  estudiantes: Estudiante[],
  paginacion: Partial<RespuestaListadoEstudiantes> = {},
): RespuestaListadoEstudiantes {
  return {
    success: true,
    data: estudiantes,
    page: 1,
    limit: 10,
    total: estudiantes.length,
    totalPages: Math.ceil(estudiantes.length / 10),
    ...paginacion,
  };
}

function crearRespuestaCarreras(
  carreras: Carrera[],
): RespuestaListadoCarreras {
  return {
    success: true,
    data: carreras,
    page: 1,
    limit: 100,
    total: carreras.length,
    totalPages: 1,
  };
}

function crearRespuestaEstudiante(
  cambios: Partial<Estudiante> = {},
): RespuestaEstudiante {
  return {
    success: true,
    message: 'Estudiante inactivado correctamente.',
    data: crearEstudiante({ id: 1, ...cambios }),
  };
}
