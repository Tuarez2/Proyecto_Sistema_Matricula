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
  type Matricula,
  type RespuestaMatricula,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';
import { ImprimirMatriculaComponent } from './imprimir-matricula.component';

interface MatriculasServiceMock {
  obtenerMatricula: ReturnType<
    typeof vi.fn<(idMatricula: number) => Observable<RespuestaMatricula>>
  >;
}

describe('ImprimirMatriculaComponent', () => {
  let fixture: ComponentFixture<ImprimirMatriculaComponent>;
  let matriculasService: MatriculasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '15';
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    matriculasService = {
      obtenerMatricula: vi.fn(() =>
        respuestaObservable(crearRespuestaMatricula()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ImprimirMatriculaComponent],
      providers: [
        provideRouter([]),
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

  it('consulta la matrícula usando el identificador de la ruta', () => {
    crearComponente();

    expect(matriculasService.obtenerMatricula).toHaveBeenCalledWith(15);
  });

  it('renderiza el comprobante institucional', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Comprobante de matrícula');
    expect(obtenerTexto()).toContain('Sistema de Matrícula');
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('MAT101 - Matemática I');
  });

  it('muestra identificación y correo para roles de gestión', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('1002003004');
    expect(obtenerTexto()).toContain('ana.vera@universidad.edu');
  });

  it('oculta datos personales para el estudiante', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    crearComponente();

    expect(obtenerTexto()).not.toContain('1002003004');
    expect(obtenerTexto()).not.toContain('ana.vera@universidad.edu');
  });

  it('muestra error cuando la matrícula no existe', () => {
    matriculasService.obtenerMatricula.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('La matrícula solicitada no existe.');
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(matriculasService.obtenerMatricula).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador de la matrícula no es válido.',
    );
  });

  it('el enlace de volver apunta al listado de matrículas', () => {
    crearComponente();

    const enlace = obtenerEnlace('Volver a matrículas');

    expect(enlace?.getAttribute('href')).toBe('/matriculas');
  });

  it('muestra valores por defecto en datos ausentes', () => {
    matriculasService.obtenerMatricula.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaMatricula({
          estudiante: undefined,
          curso: undefined,
        }),
      ),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('Estudiante 2');
    expect(obtenerTexto()).toContain('Curso 7');
    expect(obtenerTexto()).toContain('Sin periodo');
    expect(obtenerTexto()).toContain('Sin docente');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ImprimirMatriculaComponent);
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

function crearMatricula(cambios: Partial<Matricula> = {}): Matricula {
  return {
    id: 15,
    estudiante_id: 2,
    curso_id: 7,
    fecha_matricula: '2026-01-15T10:00:00.000Z',
    estado: ESTADOS_MATRICULA.inscrita,
    calificacion_final: null,
    estudiante: {
      id: 2,
      numero_matricula: 'EST-2026-001',
      nombres: 'Ana',
      apellidos: 'Vera',
      identificacion: '1002003004',
      correo: 'ana.vera@universidad.edu',
      estado_academico: 'activo',
      nivel_academico_actual: 3,
      carrera_id: 9,
    },
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

function crearRespuestaMatricula(
  cambios: Partial<Matricula> = {},
): RespuestaMatricula {
  return {
    success: true,
    data: crearMatricula(cambios),
  };
}