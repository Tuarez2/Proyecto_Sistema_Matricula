import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import {
  ESTADOS_MATRICULA,
  type FiltrosMatriculas,
  type Matricula,
  type RespuestaListadoMatriculas,
} from '../../../matriculas/models/matricula.model';
import { MatriculasService } from '../../../matriculas/services/matriculas.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type RespuestaEstudiante,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';
import { VerEstudianteComponent } from './ver-estudiante.component';

interface EstudiantesServiceMock {
  obtenerEstudiante: ReturnType<
    typeof vi.fn<(idEstudiante: number) => Observable<RespuestaEstudiante>>
  >;
}

interface MatriculasServiceMock {
  listarMatriculas: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosMatriculas) => Observable<RespuestaListadoMatriculas>
    >
  >;
}

describe('VerEstudianteComponent', () => {
  let fixture: ComponentFixture<VerEstudianteComponent>;
  let componente: VerEstudianteComponent;
  let estudiantesService: EstudiantesServiceMock;
  let matriculasService: MatriculasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '2';
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    estudiantesService = {
      obtenerEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante()),
      ),
    };
    matriculasService = {
      listarMatriculas: vi.fn(() =>
        respuestaObservable(
          crearRespuestaMatriculas([
            crearMatricula({
              estado: ESTADOS_MATRICULA.aprobada,
              curso: {
                ...crearMatricula().curso!,
                paralelo: 'A',
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
              },
            }),
          ]),
        ),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [VerEstudianteComponent],
      providers: [
        provideRouter([]),
        {
          provide: EstudiantesService,
          useValue: estudiantesService,
        },
        {
          provide: MatriculasService,
          useValue: matriculasService,
        },
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
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
  });

  it('consulta el estudiante usando el identificador de la ruta', () => {
    crearComponente();

    expect(estudiantesService.obtenerEstudiante).toHaveBeenCalledWith(2);
  });

  it('consulta el historial de matrículas del estudiante', () => {
    crearComponente();

    expect(matriculasService.listarMatriculas).toHaveBeenCalledWith({
      estudiante_id: 2,
      limit: 100,
    });
  });

  it('renderiza los datos personales y académicos', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('1002003004');
    expect(obtenerTexto()).toContain('Ingeniería de Software');
    expect(obtenerTexto()).toContain('Activo');
  });

  it('muestra el historial agrupado por periodo', () => {
    crearComponente();
    componente.mostrarPestania('historial');
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Periodo 2026-1');
    expect(obtenerTexto()).toContain('MAT101 - Matemática I');
  });

  it('muestra estado vacío cuando el estudiante no tiene matrículas', () => {
    matriculasService.listarMatriculas.mockReturnValueOnce(
      respuestaObservable(crearRespuestaMatriculas([])),
    );

    crearComponente();
    componente.mostrarPestania('historial');
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Sin matrículas registradas.');
  });

  it('muestra error al consultar el estudiante', () => {
    estudiantesService.obtenerEstudiante.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('El estudiante solicitado no existe.');
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(estudiantesService.obtenerEstudiante).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador del estudiante no es válido.',
    );
  });

  it('ADMIN ve acciones de gestión de matrículas', () => {
    crearComponente();

    expect(obtenerEnlace('Nueva matrícula')).toBeTruthy();
    expect(obtenerEnlace('Renovar matrícula')).toBeTruthy();
  });

  it('roles sin privilegios no ven acciones de gestión de matrículas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Nueva matrícula')).toBeNull();
    expect(obtenerEnlace('Renovar matrícula')).toBeNull();
  });

  it('el enlace de nueva matrícula apunta a la ruta de nueva matrícula', () => {
    crearComponente();

    expect(obtenerEnlace('Nueva matrícula')?.getAttribute('href')).toBe(
      '/matriculas/nueva',
    );
  });

  it('el enlace de renovación apunta a la ruta de renovar matrícula', () => {
    crearComponente();

    expect(obtenerEnlace('Renovar matrícula')?.getAttribute('href')).toBe(
      '/matriculas/renovar',
    );
  });

  it('el enlace de comprobante del historial apunta a la impresión', () => {
    crearComponente();
    componente.mostrarPestania('historial');
    fixture.detectChanges();

    expect(obtenerEnlace('Comprobante')?.getAttribute('href')).toBe(
      '/matriculas/imprimir/15',
    );
  });

  it('muestra valores por defecto en campos ausentes', () => {
    estudiantesService.obtenerEstudiante.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaEstudiante({
          telefono: null,
          carrera: undefined,
        }),
      ),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('Sin teléfono');
    expect(obtenerTexto()).toContain('Sin carrera');
  });

  it('el enlace de volver apunta al listado de estudiantes', () => {
    crearComponente();

    expect(obtenerEnlace('Volver a estudiantes')?.getAttribute('href')).toBe(
      '/estudiantes',
    );
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(VerEstudianteComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null;
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
    carrera: {
      id: 9,
      codigo: 'SIS',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: 1,
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaEstudiante(
  cambios: Partial<Estudiante> = {},
): RespuestaEstudiante {
  return {
    success: true,
    data: crearEstudiante(cambios),
  };
}

function crearMatricula(cambios: Partial<Matricula> = {}): Matricula {
  return {
    id: 15,
    estudiante_id: 2,
    curso_id: 7,
    fecha_matricula: '2026-01-15T10:00:00.000Z',
    estado: ESTADOS_MATRICULA.aprobada,
    calificacion_final: null,
    curso: {
      id: 7,
      periodo_id: 3,
      asignatura_id: 5,
      docente_id: 4,
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00-10:00',
      cupo_maximo: 30,
      estado: 'abierto',
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
    },
    ...cambios,
  };
}

function crearRespuestaMatriculas(
  matriculas: Matricula[],
): RespuestaListadoMatriculas {
  return {
    success: true,
    data: matriculas,
    page: 1,
    limit: 100,
    total: matriculas.length,
    totalPages: Math.ceil(matriculas.length / 100),
  };
}