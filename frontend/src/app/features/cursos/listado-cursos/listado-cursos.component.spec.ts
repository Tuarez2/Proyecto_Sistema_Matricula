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
  RespuestaListadoAsignaturas,
} from '../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../asignaturas/services/asignaturas.service';
import type {
  Docente,
  FiltrosDocentes,
  RespuestaListadoDocentes,
} from '../../docentes/models/docente.model';
import { DocentesService } from '../../docentes/services/docentes.service';
import type {
  FiltrosListadoPeriodos,
  PeriodoAcademico,
  RespuestaListadoPeriodos,
} from '../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../periodos-academicos/services/periodos-academicos.service';
import type {
  Curso,
  FiltrosCursos,
  RespuestaCambioEstadoCurso,
  RespuestaListadoCursos,
} from '../models/curso.model';
import { CursosService } from '../services/cursos.service';
import { ListadoCursosComponent } from './listado-cursos.component';

interface CursosServiceMock {
  listar: ReturnType<
    typeof vi.fn<(filtros?: FiltrosCursos) => Observable<RespuestaListadoCursos>>
  >;
  cancelarCurso: ReturnType<
    typeof vi.fn<
      (idCurso: number) => Observable<RespuestaCambioEstadoCurso>
    >
  >;
}

interface PeriodosServiceMock {
  listarPeriodos: ReturnType<
    typeof vi.fn<
      (
        filtros?: FiltrosListadoPeriodos,
      ) => Observable<RespuestaListadoPeriodos>
    >
  >;
}

interface AsignaturasServiceMock {
  listarAsignaturas: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosAsignaturas) => Observable<RespuestaListadoAsignaturas>
    >
  >;
}

interface DocentesServiceMock {
  listarDocentes: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosDocentes) => Observable<RespuestaListadoDocentes>
    >
  >;
}

describe('ListadoCursosComponent', () => {
  let fixture: ComponentFixture<ListadoCursosComponent>;
  let componente: ListadoCursosComponent;
  let cursosService: CursosServiceMock;
  let periodosService: PeriodosServiceMock;
  let asignaturasService: AsignaturasServiceMock;
  let docentesService: DocentesServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    cursosService = {
      listar: vi.fn(() =>
        respuestaObservable(
          crearRespuestaCursos([
            crearCurso({
              id: 1,
              asignatura: crearAsignaturaReferencia(),
              docente: crearDocenteReferencia(),
              periodoAcademico: crearPeriodoReferencia(),
            }),
            crearCurso({
              id: 2,
              paralelo: 'B',
              asignatura: null,
              docente: null,
              periodoAcademico: null,
            }),
          ]),
        ),
      ),
      cancelarCurso: vi.fn(() =>
        respuestaObservable(
          crearRespuestaCambioEstado({ estado: 'cancelado' }),
        ),
      ),
    };
    periodosService = {
      listarPeriodos: vi.fn(() =>
        respuestaObservable(crearRespuestaPeriodos([crearPeriodo()])),
      ),
    };
    asignaturasService = {
      listarAsignaturas: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignaturas([
            crearAsignatura({ id: 100, codigo: 'PRG1', nombre: 'Programación I' }),
          ]),
        ),
      ),
    };
    docentesService = {
      listarDocentes: vi.fn(() =>
        respuestaObservable(
          crearRespuestaDocentes([
            crearDocente({ id: 1000, nombres: 'Ana', apellidos: 'Gómez' }),
          ]),
        ),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoCursosComponent],
      providers: [
        provideRouter([]),
        { provide: CursosService, useValue: cursosService },
        { provide: PeriodosAcademicosService, useValue: periodosService },
        { provide: AsignaturasService, useValue: asignaturasService },
        { provide: DocentesService, useValue: docentesService },
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
      ],
    }).compileComponents();
  });

  it('carga cursos y catálogos al iniciar', () => {
    crearComponente();

    expect(cursosService.listar).toHaveBeenCalledWith(
      expect.objectContaining({ pagina: 1, limite: 10 }),
    );
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(obtenerTexto()).toContain('PRG1 - Programación I');
    expect(obtenerTexto()).toContain('Ana Gómez');
    expect(obtenerTexto()).toContain('Primer Semestre 2026');
  });

  it('muestra relaciones legibles y protege relaciones nulas', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('PRG1 - Programación I');
    expect(obtenerTexto()).toContain('Curso 2 (B)');
    expect(obtenerTexto()).toContain('Sin docente');
    expect(obtenerTexto()).toContain('Sin período');
  });

  it('aplica clase de badge segun el estado del curso', () => {
    cursosService.listar.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCursos([
          crearCurso({ id: 1, estado: 'abierto' }),
          crearCurso({ id: 2, estado: 'cerrado' }),
          crearCurso({ id: 3, estado: 'cancelado' }),
        ]),
      ),
    );

    crearComponente();

    expect(obtenerElemento('.estado-badge--success')).toBeTruthy();
    expect(obtenerElemento('.estado-badge--neutral')).toBeTruthy();
    expect(obtenerElemento('.estado-badge--danger')).toBeTruthy();
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    cursosService.listar.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCursos([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron cursos');
  });

  it('muestra error de red al cargar cursos', () => {
    cursosService.listar.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('aplica filtros consultando la API con la página reiniciada', () => {
    crearComponente();
    cursosService.listar.mockClear();

    componente.filtros.setValue({
      periodo_id: '10',
      asignatura_id: '100',
      docente_id: '1000',
      estado: 'abierto',
      paralelo: 'A',
    });
    componente.buscar();

    expect(cursosService.listar).toHaveBeenCalledWith({
      periodo_id: 10,
      asignatura_id: 100,
      docente_id: 1000,
      estado: 'abierto',
      paralelo: 'A',
      pagina: 1,
      limite: 10,
    });
  });

  it('no envía filtros vacíos al consultar', () => {
    crearComponente();
    cursosService.listar.mockClear();

    componente.filtros.setValue({
      periodo_id: '',
      asignatura_id: '',
      docente_id: '',
      estado: '',
      paralelo: '   ',
    });
    componente.buscar();

    expect(cursosService.listar).toHaveBeenCalledWith({
      periodo_id: undefined,
      asignatura_id: undefined,
      docente_id: undefined,
      estado: undefined,
      paralelo: undefined,
      pagina: 1,
      limite: 10,
    });
  });

  it('limpia filtros y recarga desde la primera página', () => {
    crearComponente();
    cursosService.listar.mockClear();

    componente.filtros.setValue({
      periodo_id: '10',
      asignatura_id: '',
      docente_id: '',
      estado: '',
      paralelo: '',
    });
    componente.buscar();
    componente.limpiarFiltros();

    expect(componente.filtros.getRawValue()).toEqual({
      periodo_id: '',
      asignatura_id: '',
      docente_id: '',
      estado: '',
      paralelo: '',
    });
    expect(cursosService.listar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        periodo_id: undefined,
        pagina: 1,
      }),
    );
  });

  it('cambia de página consultando la API', () => {
    cursosService.listar.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCursos([crearCurso()], { page: 1, total: 15, totalPages: 2 }),
      ),
    );

    crearComponente();
    cursosService.listar.mockClear();
    cursosService.listar.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCursos([crearCurso({ id: 3 })], { page: 2, total: 15, totalPages: 2 }),
      ),
    );

    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(cursosService.listar).toHaveBeenCalledWith(
      expect.objectContaining({ pagina: 2, limite: 10 }),
    );
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Nuevo curso')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Cancelar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Nuevo curso')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Cancelar')).toBeNull();
  });

  it('enlaza cada curso con detalle y edición', () => {
    crearComponente();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/cursos/1');
    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/cursos/editar/1',
    );
  });

  it('no muestra botón de cancelar para un curso ya cancelado', () => {
    cursosService.listar.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCursos([crearCurso({ estado: 'cancelado' })]),
      ),
    );

    crearComponente();

    expect(obtenerBoton('Cancelar')).toBeNull();
  });

  it('confirma antes de cancelar un curso y recarga el listado', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cancelarCurso(componente.cursos()[0]);
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(cursosService.cancelarCurso).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Curso cancelado correctamente.');
    expect(cursosService.listar).toHaveBeenCalledTimes(2);
  });

  it('no cancela si se cancela la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    componente.cancelarCurso(componente.cursos()[0]);

    expect(cursosService.cancelarCurso).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al cancelar', () => {
    const solicitudPendiente =
      new Subject<RespuestaCambioEstadoCurso>();

    cursosService.cancelarCurso.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cancelarCurso(componente.cursos()[0]);
    componente.cancelarCurso(componente.cursos()[1]);

    expect(cursosService.cancelarCurso).toHaveBeenCalledTimes(1);
  });

  it('muestra error de conflicto al cancelar', () => {
    cursosService.cancelarCurso.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 409,
          error: {
            success: false,
            code: 'CURSO_DUPLICADO',
            message: 'Ya existe.',
          },
        }),
      ),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cancelarCurso(componente.cursos()[0]);

    expect(componente.mensajeError()).toBe(
      'Ya existe un curso con el mismo período, asignatura y paralelo.',
    );
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListadoCursosComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function obtenerElemento(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return (
      enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null
    );
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return (
      botones.find((boton) => boton.textContent?.includes(texto)) ?? null
    );
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

function crearCurso(cambios: Partial<Curso> = {}): Curso {
  return {
    id: 1,
    periodo_id: 10,
    asignatura_id: 100,
    docente_id: 1000,
    paralelo: 'A',
    aula: 'Aula 101',
    horario: 'Lunes 08:00',
    cupo_maximo: 40,
    estado: 'abierto',
    cantidad_matriculados: 5,
    cupos_disponibles: 35,
    ...cambios,
  };
}

function crearAsignaturaReferencia() {
  return {
    id: 100,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
  };
}

function crearDocenteReferencia() {
  return {
    id: 1000,
    identificacion: '0102030405',
    nombres: 'Ana',
    apellidos: 'Gómez',
    correo: 'ana.gomez@universidad.edu',
    especialidad: 'Software',
    activo: true,
  };
}

function crearPeriodoReferencia() {
  return {
    id: 10,
    codigo: '2026-1',
    nombre: 'Primer Semestre 2026',
    fecha_inicio: '2026-03-01',
    fecha_fin: '2026-07-31',
    fecha_inicio_matricula: '2026-02-15',
    fecha_fin_matricula: '2026-03-05',
    estado: 'planificado',
  };
}

function crearRespuestaCursos(
  cursos: Curso[],
  paginacion: {
    page?: number;
    total?: number;
    totalPages?: number;
  } = {},
): RespuestaListadoCursos {
  return {
    success: true,
    data: cursos,
    page: paginacion.page ?? 1,
    limit: 10,
    total: paginacion.total ?? cursos.length,
    totalPages: paginacion.totalPages ?? 1,
  };
}

function crearRespuestaCambioEstado(
  cambios: Partial<Curso>,
): RespuestaCambioEstadoCurso {
  return {
    success: true,
    message: 'Curso cancelado correctamente.',
    data: crearCurso(cambios),
  };
}

function crearPeriodo(cambios: Partial<PeriodoAcademico> = {}): PeriodoAcademico {
  return {
    id: 10,
    codigo: '2026-1',
    nombre: 'Primer Semestre 2026',
    fecha_inicio: '2026-03-01',
    fecha_fin: '2026-07-31',
    fecha_inicio_matricula: '2026-02-15',
    fecha_fin_matricula: '2026-03-05',
    estado: 'planificado',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...cambios,
  };
}

function crearRespuestaPeriodos(
  periodos: Array<ReturnType<typeof crearPeriodo>>,
): RespuestaListadoPeriodos {
  return {
    success: true,
    data: periodos,
    page: 1,
    limit: 100,
    total: periodos.length,
    totalPages: 1,
  };
}

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 100,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    ...cambios,
  };
}

function crearRespuestaAsignaturas(
  asignaturas: Asignatura[],
): RespuestaListadoAsignaturas {
  return {
    success: true,
    data: asignaturas,
    page: 1,
    limit: 100,
    total: asignaturas.length,
    totalPages: 1,
  };
}

function crearDocente(cambios: Partial<Docente> = {}): Docente {
  return {
    id: 1000,
    identificacion: '0102030405',
    nombres: 'Ana',
    apellidos: 'Gómez',
    correo: 'ana.gomez@universidad.edu',
    telefono: null,
    especialidad: 'Software',
    activo: true,
    ...cambios,
  };
}

function crearRespuestaDocentes(docentes: Docente[]): RespuestaListadoDocentes {
  return {
    success: true,
    data: docentes,
    page: 1,
    limit: 100,
    total: docentes.length,
    totalPages: Math.ceil(docentes.length / 100),
  };
}
