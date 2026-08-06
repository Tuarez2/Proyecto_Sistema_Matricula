import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Observable } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import type { Curso, RespuestaCurso } from '../../models/curso.model';
import { CursosService } from '../../services/cursos.service';
import { VerCursoComponent } from './ver-curso.component';

interface CursosServiceMock {
  obtenerCurso: ReturnType<
    typeof vi.fn<(idCurso: number) => Observable<RespuestaCurso>>
  >;
}

describe('VerCursoComponent', () => {
  let fixture: ComponentFixture<VerCursoComponent>;
  let componente: VerCursoComponent;
  let cursosService: CursosServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '7';
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    cursosService = {
      obtenerCurso: vi.fn(() => respuestaObservable(crearRespuestaCurso())),
    };

    await TestBed.configureTestingModule({
      imports: [VerCursoComponent],
      providers: [
        provideRouter([]),
        { provide: CursosService, useValue: cursosService },
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

  it('consulta el curso y muestra sus datos legibles', () => {
    crearComponente();

    expect(cursosService.obtenerCurso).toHaveBeenCalledWith(7);
    expect(obtenerTexto()).toContain('PRG1 - Programación I');
    expect(obtenerTexto()).toContain('Ana Gómez');
    expect(obtenerTexto()).toContain('Primer Semestre 2026');
    expect(obtenerTexto()).toContain('Aula 101');
    expect(obtenerTexto()).toContain('Lunes 08:00');
    expect(obtenerTexto()).toContain('Abierto');
  });

  it('protege relaciones nulas', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaCurso({
          asignatura: null,
          docente: null,
          periodoAcademico: null,
        }),
      ),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('Sin asignatura');
    expect(obtenerTexto()).toContain('Sin docente');
    expect(obtenerTexto()).toContain('Sin período');
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(cursosService.obtenerCurso).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador del curso no es válido.',
    );
  });

  it('muestra error cuando el curso no existe', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('El curso solicitado no existe.');
  });

  it('muestra error de red al consultar', () => {
    cursosService.obtenerCurso.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('ADMIN ve enlace para editar el curso', () => {
    crearComponente();

    expect(obtenerEnlace('Editar curso')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Editar curso')).toBeNull();
  });

  it('muestra el enlace de volver a cursos', () => {
    crearComponente();

    expect(obtenerEnlace('Volver a cursos')).toBeTruthy();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(VerCursoComponent);
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

    return (
      enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null
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
    data: crearCurso(cambios),
  };
}
