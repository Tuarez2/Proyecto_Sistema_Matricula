import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Asignatura,
  FiltrosAsignaturas,
  RespuestaListadoAsignaturas,
} from '../../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../../asignaturas/services/asignaturas.service';
import type {
  Docente,
  FiltrosDocentes,
  RespuestaListadoDocentes,
} from '../../../docentes/models/docente.model';
import { DocentesService } from '../../../docentes/services/docentes.service';
import type {
  FiltrosListadoPeriodos,
  PeriodoAcademico,
  RespuestaListadoPeriodos,
} from '../../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../../periodos-academicos/services/periodos-academicos.service';
import type {
  Curso,
  RespuestaCurso,
  SolicitudCrearCurso,
} from '../../models/curso.model';
import { CursosService } from '../../services/cursos.service';
import { CrearCursoComponent } from './crear-curso.component';

interface CursosServiceMock {
  crearCurso: ReturnType<
    typeof vi.fn<(solicitud: SolicitudCrearCurso) => Observable<RespuestaCurso>>
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

describe('CrearCursoComponent', () => {
  let fixture: ComponentFixture<CrearCursoComponent>;
  let componente: CrearCursoComponent;
  let cursosService: CursosServiceMock;
  let periodosService: PeriodosServiceMock;
  let asignaturasService: AsignaturasServiceMock;
  let docentesService: DocentesServiceMock;
  let enrutador: Router;

  beforeEach(async () => {
    cursosService = {
      crearCurso: vi.fn(() => respuestaObservable(crearRespuestaCurso())),
    };
    periodosService = {
      listarPeriodos: vi.fn(() =>
        respuestaObservable(
          crearRespuestaPeriodos([
            crearPeriodo({ id: 10, estado: 'planificado' }),
            crearPeriodo({ id: 11, estado: 'matricula_abierta' }),
            crearPeriodo({ id: 12, estado: 'cerrado' }),
          ]),
        ),
      ),
    };
    asignaturasService = {
      listarAsignaturas: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignaturas([
            crearAsignatura({ id: 100 }),
            crearAsignatura({ id: 101, activo: false }),
          ]),
        ),
      ),
    };
    docentesService = {
      listarDocentes: vi.fn(() =>
        respuestaObservable(
          crearRespuestaDocentes([
            crearDocente({ id: 1000 }),
          ]),
        ),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [CrearCursoComponent],
      providers: [
        provideRouter([]),
        { provide: CursosService, useValue: cursosService },
        { provide: PeriodosAcademicosService, useValue: periodosService },
        { provide: AsignaturasService, useValue: asignaturasService },
        { provide: DocentesService, useValue: docentesService },
      ],
    }).compileComponents();

    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('carga solo períodos habilitados para gestionar cursos', () => {
    crearComponente();

    expect(periodosService.listarPeriodos).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(componente.periodos().map((periodo) => periodo.id)).toEqual([
      10, 11,
    ]);
  });

  it('carga solo asignaturas activas con límite explícito', () => {
    crearComponente();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      activo: true,
      limite: 100,
    });
    expect(componente.asignaturas().map((asignatura) => asignatura.id)).toEqual(
      [100],
    );
  });

  it('solicita docentes activos con límite explícito para el catálogo', () => {
    crearComponente();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      activo: true,
      limite: 100,
    });
    expect(componente.docentes().map((docente) => docente.id)).toEqual([1000]);
  });

  it('muestra error cuando falla un catálogo', () => {
    periodosService.listarPeriodos.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(componente.mensajeError()).toBe(
      'No fue posible conectar con el servidor.',
    );
  });

  it('rechaza formulario inválido', () => {
    crearComponente();

    componente.guardarCurso();
    fixture.detectChanges();

    expect(cursosService.crearCurso).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los datos del curso.');
  });

  it('envía payload exacto y navega al listado', () => {
    crearComponente();
    completarFormulario();

    componente.guardarCurso();

    expect(cursosService.crearCurso).toHaveBeenCalledWith({
      periodo_id: 10,
      asignatura_id: 100,
      docente_id: 1000,
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00',
      cupo_maximo: 40,
    });
    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/cursos');
  });

  it('muestra error de curso duplicado y conserva valores', () => {
    cursosService.crearCurso.mockReturnValueOnce(
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

    crearComponente();
    completarFormulario();
    componente.guardarCurso();

    expect(componente.mensajeError()).toBe(
      'Ya existe un curso con el mismo período, asignatura y paralelo.',
    );
    expect(componente.formularioCurso.controls.paralelo.value).toBe('A');
  });

  it('muestra error cuando el período académico no existe', () => {
    cursosService.crearCurso.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 404,
          error: {
            success: false,
            code: 'PERIODO_ACADEMICO_NOT_FOUND',
            message: 'No existe.',
          },
        }),
      ),
    );

    crearComponente();
    completarFormulario();
    componente.guardarCurso();

    expect(componente.mensajeError()).toBe(
      'El período académico seleccionado no existe.',
    );
  });

  it('muestra error cuando el período no permite gestionar cursos', () => {
    cursosService.crearCurso.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 409,
          error: {
            success: false,
            code: 'PERIODO_ACADEMICO_NO_HABILITADO',
            message: 'No habilitado.',
          },
        }),
      ),
    );

    crearComponente();
    completarFormulario();
    componente.guardarCurso();

    expect(componente.mensajeError()).toBe(
      'El período académico seleccionado no permite gestionar cursos.',
    );
  });

  it('evita doble envío', () => {
    const solicitudPendiente = new Subject<RespuestaCurso>();
    cursosService.crearCurso.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    completarFormulario();
    componente.guardarCurso();
    componente.guardarCurso();

    expect(cursosService.crearCurso).toHaveBeenCalledTimes(1);
  });

  it('cancela navegando al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/cursos');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(CrearCursoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function completarFormulario(): void {
    componente.formularioCurso.setValue({
      periodo_id: '10',
      asignatura_id: '100',
      docente_id: '1000',
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00',
      cupo: 40,
    });
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
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
    ...cambios,
  };
}

function crearRespuestaCurso(
  cambios: Partial<Curso> = {},
): RespuestaCurso {
  return {
    success: true,
    message: 'Curso creado correctamente.',
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
