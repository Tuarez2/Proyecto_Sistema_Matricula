import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import {
  ESTADOS_CURSO,
  type Curso,
  type RespuestaListadoCursos,
} from '../../../cursos/models/curso.model';
import { CursosService } from '../../../cursos/services/cursos.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type FiltrosEstudiantes,
  type RespuestaListadoEstudiantes,
} from '../../../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../../../estudiantes/services/estudiantes.service';
import {
  ESTADOS_MATRICULA,
  type RespuestaMatricula,
  type SolicitudCrearMatricula,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';
import { CrearMatriculaComponent } from './crear-matricula.component';

interface MatriculasServiceMock {
  crearMatricula: ReturnType<
    typeof vi.fn<
      (solicitud: SolicitudCrearMatricula) => Observable<RespuestaMatricula>
    >
  >;
}

interface EstudiantesServiceMock {
  listarEstudiantes: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosEstudiantes) => Observable<RespuestaListadoEstudiantes>
    >
  >;
}

interface CursosServiceMock {
  listar: ReturnType<
    typeof vi.fn<
      (filtros?: { estado?: string; limite?: number }) => Observable<RespuestaListadoCursos>
    >
  >;
}

describe('CrearMatriculaComponent', () => {
  let fixture: ComponentFixture<CrearMatriculaComponent>;
  let componente: CrearMatriculaComponent;
  let matriculasService: MatriculasServiceMock;
  let estudiantesService: EstudiantesServiceMock;
  let cursosService: CursosServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    matriculasService = {
      crearMatricula: vi.fn(() =>
        respuestaObservable(crearRespuestaMatricula()),
      ),
    };
    estudiantesService = {
      listarEstudiantes: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiantes()),
      ),
    };
    cursosService = {
      listar: vi.fn(() => respuestaObservable(crearRespuestaCursos())),
    };
    navegarPorUrl = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [CrearMatriculaComponent],
      providers: [
        provideRouter([]),
        {
          provide: MatriculasService,
          useValue: matriculasService,
        },
        {
          provide: EstudiantesService,
          useValue: estudiantesService,
        },
        {
          provide: CursosService,
          useValue: cursosService,
        },
      ],
    }).compileComponents();

    const enrutador = TestBed.inject(Router);
    navegarPorUrl = vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(CrearMatriculaComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga estudiantes activos y cursos abiertos al iniciar', () => {
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledWith({
      estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
      limite: 100,
    });
    expect(cursosService.listar).toHaveBeenCalledWith({
      estado: ESTADOS_CURSO.ABIERTO,
      limite: 100,
    });
    expect(componente.estudiantes()).toEqual([
      expect.objectContaining({ id: 2, nombres: 'Ana' }),
    ]);
    expect(componente.cursos()).toEqual([
      expect.objectContaining({ id: 7, estado: ESTADOS_CURSO.ABIERTO }),
    ]);
    expect(obtenerTexto()).toContain('EST-2026-001 - Ana Vera');
    expect(obtenerTexto()).toContain('MAT101 - Matemática I');
  });

  it('marca el formulario como inválido sin estudiante ni curso', () => {
    componente.guardar();
    fixture.detectChanges();

    expect(matriculasService.crearMatricula).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Seleccione un estudiante y un curso válidos.');
    expect(obtenerTexto()).toContain('El estudiante es obligatorio.');
    expect(obtenerTexto()).toContain('El curso es obligatorio.');
  });

  it('envía el payload exacto al crear', () => {
    completarFormulario();

    componente.guardar();

    expect(matriculasService.crearMatricula).toHaveBeenCalledWith({
      estudiante_id: 2,
      curso_id: 7,
    });
  });

  it('navega al listado después de crear', () => {
    completarFormulario();

    componente.guardar();

    expect(navegarPorUrl).toHaveBeenCalledWith('/matriculas');
  });

  it('muestra error de matrícula duplicada y conserva datos del formulario', () => {
    matriculasService.crearMatricula.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'MATRICULA_DUPLICADA',
          message: 'Duplicada.',
        },
      })),
    );
    completarFormulario();

    componente.guardar();
    fixture.detectChanges();

    expect(componente.mensajeError()).toBe(
      'El estudiante ya tiene una matrícula registrada para este curso.',
    );
    expect(componente.formularioMatricula.getRawValue()).toEqual({
      estudiante_id: '2',
      curso_id: '7',
    });
    expect(navegarPorUrl).not.toHaveBeenCalled();
  });

  it('muestra errores de validación del backend', () => {
    matriculasService.crearMatricula.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          message: 'El curso debe ser válido.',
        },
      })),
    );
    completarFormulario();

    componente.guardar();

    expect(componente.mensajeError()).toBe('El curso debe ser válido.');
  });

  it('muestra conflictos académicos del backend', () => {
    matriculasService.crearMatricula.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'ASIGNATURA_FUERA_DE_MALLA',
          message: 'Fuera de malla.',
        },
      })),
    );
    completarFormulario();

    componente.guardar();

    expect(componente.mensajeError()).toBe(
      'La asignatura no pertenece a la malla curricular del estudiante.',
    );
  });

  it('previene envíos duplicados', () => {
    const solicitudPendiente = new Subject<RespuestaMatricula>();

    matriculasService.crearMatricula.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    completarFormulario();

    componente.guardar();
    componente.guardar();

    expect(matriculasService.crearMatricula).toHaveBeenCalledTimes(1);
  });

  it('muestra error cuando falla la carga de catálogos', async () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    const fixtureConError = TestBed.createComponent(CrearMatriculaComponent);
    fixtureConError.detectChanges();

    expect(fixtureConError.nativeElement.textContent).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('cancelar vuelve al listado', () => {
    componente.cancelar();

    expect(navegarPorUrl).toHaveBeenCalledWith('/matriculas');
  });

  function completarFormulario(): void {
    componente.formularioMatricula.controls.estudiante_id.setValue('2');
    componente.formularioMatricula.controls.curso_id.setValue('7');
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

function crearEstudiante(cambios: Partial<Estudiante> = {}): Estudiante {
  return {
    id: 2,
    carrera_id: 9,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
    ...cambios,
  };
}

function crearCurso(cambios: Partial<Curso> = {}): Curso {
  return {
    id: 7,
    periodo_id: 3,
    asignatura_id: 5,
    docente_id: 4,
    paralelo: 'A',
    aula: 'Aula 101',
    horario: 'Lunes 08:00-10:00',
    cupo_maximo: 30,
    estado: ESTADOS_CURSO.ABIERTO,
    cupos_disponibles: 20,
    asignatura: {
      id: 5,
      codigo: 'MAT101',
      nombre: 'Matemática I',
      creditos: 4,
      nivel_academico: 1,
      activo: true,
    },
    docente: {
      id: 4,
      identificacion: '0912345678',
      nombres: 'Luis',
      apellidos: 'Paz',
      correo: 'luis.paz@universidad.edu',
      especialidad: 'Matemática',
      activo: true,
    },
    periodoAcademico: {
      id: 3,
      codigo: '2026-1',
      nombre: 'Periodo 2026-1',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-06-30',
      fecha_inicio_matricula: '2025-12-01',
      fecha_fin_matricula: '2026-01-31',
      estado: 'matricula_abierta',
    },
    ...cambios,
  };
}

function crearRespuestaEstudiantes(): RespuestaListadoEstudiantes {
  return {
    success: true,
    data: [crearEstudiante()],
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  };
}

function crearRespuestaCursos(): RespuestaListadoCursos {
  return {
    success: true,
    data: [crearCurso()],
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  };
}

function crearRespuestaMatricula(): RespuestaMatricula {
  return {
    success: true,
    message: 'Matrícula creada correctamente.',
    data: {
      id: 15,
      estudiante_id: 2,
      curso_id: 7,
      fecha_matricula: '2026-01-15T10:00:00.000Z',
      estado: ESTADOS_MATRICULA.inscrita,
      calificacion_final: null,
    },
  };
}
