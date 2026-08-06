import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import type { Carrera, RespuestaCarrera } from '../../models/carrera.model';
import { CarrerasService } from '../../services/carreras.service';
import { VerCarreraComponent } from './ver-carrera.component';

interface CarrerasServiceMock {
  obtenerCarrera: ReturnType<
    typeof vi.fn<(idCarrera: number) => Observable<RespuestaCarrera>>
  >;
}

describe('VerCarreraComponent', () => {
  let fixture: ComponentFixture<VerCarreraComponent>;
  let carrerasService: CarrerasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '7';
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    carrerasService = {
      obtenerCarrera: vi.fn(() => respuestaObservable(crearRespuestaCarrera())),
    };

    await TestBed.configureTestingModule({
      imports: [VerCarreraComponent],
      providers: [
        provideRouter([]),
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

  it('consulta la carrera usando el identificador de ruta', () => {
    crearComponente();

    expect(carrerasService.obtenerCarrera).toHaveBeenCalledWith(7);
  });

  it('renderiza datos académicos, facultad y relaciones', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('SOF');
    expect(obtenerTexto()).toContain('Ingeniería de Software');
    expect(obtenerTexto()).toContain('SIS - Sistemas');
    expect(obtenerTexto()).toContain('8 semestres');
    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('Ana Pérez');
  });

  it('muestra estados vacíos de relaciones', () => {
    carrerasService.obtenerCarrera.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarrera({
        asignaturas: [],
        estudiantes: [],
      })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No hay asignaturas asociadas a esta carrera.',
    );
    expect(obtenerTexto()).toContain(
      'No hay estudiantes asociados a esta carrera.',
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

    expect(carrerasService.obtenerCarrera).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('El identificador de la carrera no es válido.');
  });

  it('muestra error cuando la carrera no existe', () => {
    carrerasService.obtenerCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('La carrera solicitada no existe.');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(VerCarreraComponent);
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
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

function crearCarrera(cambios: Partial<Carrera> = {}): Carrera {
  return {
    id: 7,
    codigo: 'SOF',
    nombre: 'Ingeniería de Software',
    duracion_semestres: 8,
    facultad_id: 2,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    facultad: {
      id: 2,
      codigo: 'SIS',
      nombre: 'Sistemas',
      activo: true,
    },
    asignaturas: [
      {
        id: 11,
        codigo: 'PRG1',
        nombre: 'Programación I',
        creditos: 4,
        nivel_academico: 1,
        activo: true,
      },
    ],
    estudiantes: [
      {
        id: 3,
        identificacion: '1000000001',
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana.perez@universidad.edu',
        estado_academico: 'activo',
      },
    ],
    ...cambios,
  };
}

function crearRespuestaCarrera(
  cambios: Partial<Carrera> = {},
): RespuestaCarrera {
  return {
    success: true,
    data: crearCarrera(cambios),
  };
}
