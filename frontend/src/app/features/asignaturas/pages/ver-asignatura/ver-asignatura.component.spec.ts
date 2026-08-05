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
import type { Asignatura, RespuestaAsignatura } from '../../models/asignatura.model';
import { AsignaturasService } from '../../services/asignaturas.service';
import { VerAsignaturaComponent } from './ver-asignatura.component';

interface AsignaturasServiceMock {
  obtenerAsignatura: ReturnType<
    typeof vi.fn<(idAsignatura: number) => Observable<RespuestaAsignatura>>
  >;
}

describe('VerAsignaturaComponent', () => {
  let fixture: ComponentFixture<VerAsignaturaComponent>;
  let asignaturasService: AsignaturasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '7';
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    asignaturasService = {
      obtenerAsignatura: vi.fn(() =>
        respuestaObservable(crearRespuestaAsignatura()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [VerAsignaturaComponent],
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

  it('consulta la asignatura usando el identificador de ruta', () => {
    crearComponente();

    expect(asignaturasService.obtenerAsignatura).toHaveBeenCalledWith(7);
  });

  it('renderiza datos académicos, carreras y cursos asociados', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('PRG1');
    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('SOF - Ingeniería de Software');
    expect(obtenerTexto()).toContain('A');
    expect(obtenerTexto()).toContain('abierto');
  });

  it('muestra estados vacíos de relaciones', () => {
    asignaturasService.obtenerAsignatura.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaAsignatura({ carreras: [], cursos: [] }),
      ),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No hay carreras asociadas a esta asignatura.',
    );
    expect(obtenerTexto()).toContain(
      'No hay cursos asociados a esta asignatura.',
    );
  });

  it('muestra edición solo para ADMIN', () => {
    crearComponente();

    expect(obtenerEnlace('Editar')).toBeTruthy();

    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));
    crearComponente();

    expect(obtenerEnlace('Editar')).toBeNull();
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(asignaturasService.obtenerAsignatura).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador de la asignatura no es válido.',
    );
  });

  it('muestra error cuando la asignatura no existe', () => {
    asignaturasService.obtenerAsignatura.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('La asignatura solicitada no existe.');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(VerAsignaturaComponent);
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
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 7,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    carreras: [
      {
        id: 2,
        codigo: 'SOF',
        nombre: 'Ingeniería de Software',
        activo: true,
      },
    ],
    cursos: [
      {
        id: 11,
        paralelo: 'A',
        aula: 'A101',
        horario: 'Lunes 07:00 - 09:00',
        estado: 'abierto',
        cupo_maximo: 40,
      },
    ],
    ...cambios,
  };
}

function crearRespuestaAsignatura(
  cambios: Partial<Asignatura> = {},
): RespuestaAsignatura {
  return {
    success: true,
    data: crearAsignatura(cambios),
  };
}