import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Asignatura,
  FiltrosAsignaturas,
  RespuestaListadoAsignaturas,
} from '../../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../../asignaturas/services/asignaturas.service';
import type {
  Docente,
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
  SolicitudActualizarCurso,
} from '../../models/curso.model';
import { CursosService } from '../../services/cursos.service';
import { EditarCursoComponent } from './editar-curso.component';

interface CursosServiceMock {
  obtenerCurso: ReturnType<
    typeof vi.fn<(idCurso: number) => Observable<RespuestaCurso>>
  >;
  actualizarCurso: ReturnType<
    typeof vi.fn<
      (
        idCurso: number,
        solicitud: SolicitudActualizarCurso,
      ) => Observable<RespuestaCurso>
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
    typeof vi.fn<() => Observable<RespuestaListadoDocentes>>
  >;
}

describe('EditarCursoComponent', () => {
  let fixture: ComponentFixture<EditarCursoComponent>;
  let componente: EditarCursoComponent;
  let cursosService: CursosServiceMock;
  let periodosService: PeriodosServiceMock;
  let asignaturasService: AsignaturasServiceMock;
  let docentesService: DocentesServiceMock;
  let enrutador: Router;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '7';
    cursosService = {
      obtenerCurso: vi.fn(() => respuestaObservable(crearRespuestaCurso())),
      actualizarCurso: vi.fn(() =>
        respuestaObservable(crearRespuestaCurso({ aula: 'Aula 201' })),
      ),
    };
    periodosService = {
      listarPeriodos: vi.fn(() =>
        respuestaObservable(
          crearRespuestaPeriodos([
            crearPeriodo({ id: 10, estado: 'planificado' }),
            crearPeriodo({ id: 11, estado: 'cerrado' }),
          ]),
        ),
      ),
    };
    asignaturasService = {
      listarAsignaturas: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignaturas([
            crearAsignatura({ id: 100 }),
          ]),
        ),
      ),
    };
    docentesService = {
      listarDocentes: vi.fn(() =>
        respuestaObservable(
          crearRespuestaDocentes([crearDocente({ id: 1000 })]),
        ),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EditarCursoComponent],
      providers: [
        provideRouter([]),
        { provide: CursosService, useValue: cursosService },
        { provide: PeriodosAcademicosService, useValue: periodosService },
        { provide: AsignaturasService, useValue: asignaturasService },
        { provide: DocentesService, useValue: docentesService },
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: {
              paramMap: convertToParamMap({ id: parametroId }),
            },
          }),
        },
      ],
    }).compileComponents();

    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('consulta el curso usando el identificador de ruta', () => {
    crearComponente();

    expect(cursosService.obtenerCurso).toHaveBeenCalledWith(7);
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledWith({
      activo: true,
      limite: 100,
    });
  });

  it('puebla el formulario con el curso consultado', () => {
    crearComponente();

    expect(componente.formularioCurso.getRawValue()).toEqual({
      periodo_id: '10',
      asignatura_id: '100',
      docente_id: '1000',
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00',
      cupo: 40,
    });
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(cursosService.obtenerCurso).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador del curso no es válido.',
    );
  });

  it('incluye la asignatura actual aunque esté inactiva', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCurso({
          asignatura_id: 101,
          asignatura: {
            id: 101,
            codigo: 'LEG1',
            nombre: 'Legislación',
            creditos: 3,
            nivel_academico: 2,
            activo: false,
          },
        }),
      ),
    );

    crearComponente();

    expect(
      componente.asignaturasEdicion().map((asignatura) => asignatura.id),
    ).toEqual([100, 101]);
  });

  it('envía payload exacto y navega al listado', () => {
    crearComponente();
    componente.formularioCurso.setValue({
      periodo_id: '10',
      asignatura_id: '100',
      docente_id: '1000',
      paralelo: 'B',
      aula: 'Aula 201',
      horario: 'Viernes 10:00',
      cupo: 35,
    });

    componente.guardarCurso();

    expect(cursosService.actualizarCurso).toHaveBeenCalledWith(7, {
      periodo_id: 10,
      asignatura_id: 100,
      docente_id: 1000,
      paralelo: 'B',
      aula: 'Aula 201',
      horario: 'Viernes 10:00',
      cupo_maximo: 35,
    });
    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/cursos');
  });

  it('rechaza formulario inválido', () => {
    crearComponente();
    cursosService.actualizarCurso.mockClear();
    componente.formularioCurso.controls.paralelo.setValue('');

    componente.guardarCurso();

    expect(cursosService.actualizarCurso).not.toHaveBeenCalled();
    expect(componente.mensajeError()).toBe('Revise los datos del curso.');
  });

  it('muestra error cuando el curso no existe', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('El curso solicitado no existe.');
  });

  it('muestra error de cupo insuficiente al actualizar', () => {
    cursosService.actualizarCurso.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 409,
          error: {
            success: false,
            code: 'CUPO_INSUFICIENTE',
            message: 'Cupo menor a matriculados.',
          },
        }),
      ),
    );

    crearComponente();
    componente.guardarCurso();

    expect(componente.mensajeError()).toBe(
      'El cupo máximo no puede ser menor que la cantidad de matriculados.',
    );
  });

  it('evita doble envío', () => {
    const solicitudPendiente = new Subject<RespuestaCurso>();
    cursosService.actualizarCurso.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.guardarCurso();
    componente.guardarCurso();

    expect(cursosService.actualizarCurso).toHaveBeenCalledTimes(1);
  });

  it('deshabilita el formulario cuando el curso está cancelado', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCurso({ estado: 'cancelado' })),
    );

    crearComponente();

    expect(componente.puedeEditar()).toBe(false);
    expect(componente.formularioCurso.disabled).toBe(true);
    expect(obtenerTexto()).toContain(
      'El curso está cancelado y no se puede modificar.',
    );
  });

  it('no permite editar cuando el período del curso no gestiona modificaciones', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCurso({
          periodo_id: 11,
          periodoAcademico: {
            id: 11,
            codigo: '2026-2',
            nombre: 'Segundo Semestre 2026',
            fecha_inicio: '2026-09-01',
            fecha_fin: '2026-12-31',
            fecha_inicio_matricula: '2026-08-15',
            fecha_fin_matricula: '2026-09-05',
            estado: 'cerrado',
          },
        }),
      ),
    );

    crearComponente();

    expect(componente.puedeEditar()).toBe(false);
    expect(componente.formularioCurso.disabled).toBe(true);
  });

  it('cancela navegando al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/cursos');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(EditarCursoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
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
    id: 7,
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
    periodoAcademico: {
      id: 10,
      codigo: '2026-1',
      nombre: 'Primer Semestre 2026',
      fecha_inicio: '2026-03-01',
      fecha_fin: '2026-07-31',
      fecha_inicio_matricula: '2026-02-15',
      fecha_fin_matricula: '2026-03-05',
      estado: 'planificado',
    },
    asignatura: {
      id: 100,
      codigo: 'PRG1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
      activo: true,
    },
    docente: {
      id: 1000,
      identificacion: '0102030405',
      nombres: 'Ana',
      apellidos: 'Gómez',
      correo: 'ana.gomez@universidad.edu',
      especialidad: 'Software',
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaCurso(
  cambios: Partial<Curso> = {},
): RespuestaCurso {
  return {
    success: true,
    message: 'Curso actualizado correctamente.',
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
  };
}
