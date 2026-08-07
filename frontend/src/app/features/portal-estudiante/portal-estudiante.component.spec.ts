import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import {
  ESTADOS_MATRICULA,
  type Matricula,
} from '../matriculas/models/matricula.model';
import type {
  FiltrosMatriculas,
  RespuestaListadoMatriculas,
} from '../matriculas/models/matricula.model';
import { MatriculasService } from '../matriculas/services/matriculas.service';
import type { RespuestaEstudiante } from '../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../estudiantes/services/estudiantes.service';
import { PortalEstudianteComponent } from './portal-estudiante.component';

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

describe('PortalEstudianteComponent', () => {
  let fixture: ComponentFixture<PortalEstudianteComponent>;
  let componente: PortalEstudianteComponent;
  let estudiantesService: EstudiantesServiceMock;
  let matriculasService: MatriculasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuarioConEstudiante(),
    );
    estudiantesService = {
      obtenerEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante()),
      ),
    };
    matriculasService = {
      listarMatriculas: vi.fn(() =>
        respuestaObservable(crearRespuestaMatriculas([crearMatricula()])),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [PortalEstudianteComponent],
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
      ],
    }).compileComponents();
  });

  it('consulta el estudiante usando el id de la sesion', () => {
    crearComponente();

    expect(estudiantesService.obtenerEstudiante).toHaveBeenCalledWith(2);
  });

  it('consulta las matrículas propias del estudiante', () => {
    crearComponente();

    expect(matriculasService.listarMatriculas).toHaveBeenCalledWith({
      estudiante_id: 2,
      limit: 100,
    });
  });

  it('renderiza los datos del estudiante', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('EST-2026-001');
  });

  it('renderiza las matrículas agrupadas por periodo', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Periodo 2026-1');
    expect(obtenerTexto()).toContain('MAT101 - Matemática I');
    expect(obtenerTexto()).toContain('Inscrita');
  });

  it('el comprobante apunta a la ruta de impresion', () => {
    crearComponente();

    const enlace = obtenerEnlace('Comprobante');

    expect(enlace?.getAttribute('href')).toBe('/matriculas/imprimir/15');
  });

  it('no consulta servicios cuando el usuario no esta vinculado a un estudiante', () => {
    usuarioActual.set(crearUsuario({ estudiante_id: null }));

    crearComponente();

    expect(estudiantesService.obtenerEstudiante).not.toHaveBeenCalled();
    expect(matriculasService.listarMatriculas).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Contacte al administrador');
  });

  it('muestra error de API al consultar el estudiante', () => {
    estudiantesService.obtenerEstudiante.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('muestra estado vacío cuando no hay matrículas', () => {
    matriculasService.listarMatriculas.mockReturnValueOnce(
      respuestaObservable(crearRespuestaMatriculas([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('Sin matrículas registradas.');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(PortalEstudianteComponent);
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

function crearUsuario(
  cambios: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'activo',
    debe_cambiar_password: false,
    estudiante_id: 2,
    docente_id: null,
    rol: {
      id: 1,
      codigo: CODIGOS_ROL.ESTUDIANTE,
      nombre: 'Estudiante',
    },
    ...cambios,
  };
}

function crearUsuarioConEstudiante(): UsuarioAutenticado {
  return crearUsuario();
}

function crearMatricula(cambios: Partial<Matricula> = {}): Matricula {
  return {
    id: 15,
    estudiante_id: 2,
    curso_id: 7,
    fecha_matricula: '2026-01-15T10:00:00.000Z',
    estado: ESTADOS_MATRICULA.inscrita,
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

function crearRespuestaEstudiante(): RespuestaEstudiante {
  return {
    success: true,
    data: {
      id: 2,
      carrera_id: 9,
      numero_matricula: 'EST-2026-001',
      identificacion: '1002003004',
      nombres: 'Ana',
      apellidos: 'Vera',
      correo: 'ana.vera@universidad.edu',
      telefono: null,
      fecha_nacimiento: '2001-03-12',
      estado_academico: 'activo',
      nivel_academico_actual: 3,
      carrera: {
        id: 9,
        codigo: 'SIS',
        nombre: 'Ingeniería de Software',
        duracion_semestres: 8,
        facultad_id: 1,
        activo: true,
      },
    },
  };
}
