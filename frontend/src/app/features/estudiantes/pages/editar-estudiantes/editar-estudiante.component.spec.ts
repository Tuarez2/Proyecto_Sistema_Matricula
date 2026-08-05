import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import type { RespuestaCarreras } from '../../../carreras/models/carrera.model';
import { CarrerasService } from '../../../carreras/services/carreras.service';
import { EstudianteFormComponent } from '../../components/estudiante-form/estudiante-form.component';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type RespuestaEstudiante,
  type SolicitudActualizarEstudiante,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';
import { EditarEstudianteComponent } from './editar-estudiante.component';

interface EstudiantesServiceMock {
  obtenerEstudiante: ReturnType<
    typeof vi.fn<(idEstudiante: number) => Observable<RespuestaEstudiante>>
  >;
  actualizarEstudiante: ReturnType<
    typeof vi.fn<
      (
        idEstudiante: number,
        solicitud: SolicitudActualizarEstudiante,
      ) => Observable<RespuestaEstudiante>
    >
  >;
}

interface CarrerasServiceMock {
  listarCarreras: ReturnType<typeof vi.fn<() => Observable<RespuestaCarreras>>>;
}

describe('EditarEstudianteComponent', () => {
  let fixture: ComponentFixture<EditarEstudianteComponent>;
  let componente: EditarEstudianteComponent;
  let estudiantesService: EstudiantesServiceMock;
  let carrerasService: CarrerasServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;
  let parametroId = '15';

  beforeEach(async () => {
    parametroId = '15';
    estudiantesService = {
      obtenerEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante()),
      ),
      actualizarEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante({
          correo: 'actualizado@universidad.edu',
        })),
      ),
    };
    carrerasService = {
      listarCarreras: vi.fn(() => respuestaObservable(crearRespuestaCarreras())),
    };
    navegarPorUrl = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [EditarEstudianteComponent],
      providers: [
        {
          provide: EstudiantesService,
          useValue: estudiantesService,
        },
        {
          provide: CarrerasService,
          useValue: carrerasService,
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: navegarPorUrl,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => parametroId,
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('lee el ID de la ruta y carga el estudiante', () => {
    crearComponente();

    expect(estudiantesService.obtenerEstudiante).toHaveBeenCalledWith(15);
    expect(componente.estudiante()?.identificacion).toBe('1002003004');
  });

  it('puebla el formulario con el estudiante consultado', () => {
    crearComponente();

    const formulario = obtenerFormulario();

    expect(formulario.formularioEstudiante.controls.numeroMatricula.value).toBe(
      'EST-2026-001',
    );
    expect(formulario.formularioEstudiante.controls.carreraId.value).toBe('2');
  });

  it('muestra error si el ID no es valido', () => {
    parametroId = 'abc';

    crearComponente();

    expect(estudiantesService.obtenerEstudiante).not.toHaveBeenCalled();
    expect(componente.mensajeError()).toBe(
      'El identificador del estudiante no es válido.',
    );
  });

  it('maneja recurso inexistente', () => {
    estudiantesService.obtenerEstudiante.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(componente.mensajeError()).toBe('El estudiante no existe.');
  });

  it('actualiza con el payload recibido del formulario', () => {
    crearComponente();
    const solicitud: SolicitudActualizarEstudiante = {
      correo: 'actualizado@universidad.edu',
      telefono: null,
    };

    componente.guardarEstudiante(solicitud);

    expect(estudiantesService.actualizarEstudiante).toHaveBeenCalledWith(
      15,
      solicitud,
    );
  });

  it('navega al listado despues de actualizar', () => {
    crearComponente();

    componente.guardarEstudiante({ correo: 'actualizado@universidad.edu' });

    expect(navegarPorUrl).toHaveBeenCalledWith('/estudiantes');
  });

  it('muestra error del backend al actualizar', () => {
    estudiantesService.actualizarEstudiante.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          code: 'CARRERA_NOT_FOUND',
          message: 'Carrera inexistente.',
        },
      })),
    );
    crearComponente();

    componente.guardarEstudiante({ carrera_id: 999 });

    expect(componente.mensajeError()).toBe('La carrera especificada no existe.');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(EditarEstudianteComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerFormulario(): EstudianteFormComponent {
    const depuracion = fixture.debugElement.query(
      By.directive(EstudianteFormComponent),
    );

    if (!depuracion) {
      throw new Error('No existe el formulario de estudiante.');
    }

    return depuracion.componentInstance as EstudianteFormComponent;
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
    id: 15,
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
    carrera: {
      id: 2,
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
    message: 'Estudiante actualizado correctamente.',
    data: crearEstudiante(cambios),
  };
}

function crearRespuestaCarreras(): RespuestaCarreras {
  return {
    success: true,
    data: [
      {
        id: 2,
        codigo: 'SIS',
        nombre: 'Ingeniería de Software',
        duracion_semestres: 8,
        facultad_id: 1,
        activo: true,
      },
    ],
  };
}
