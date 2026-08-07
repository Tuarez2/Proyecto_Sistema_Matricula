import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  FiltrosCarreras,
  RespuestaCarreras,
} from '../../../carreras/models/carrera.model';
import { CarrerasService } from '../../../carreras/services/carreras.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type RespuestaEstudiante,
  type SolicitudCrearEstudiante,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';
import { CrearEstudianteComponent } from './crear-estudiante.component';

interface EstudiantesServiceMock {
  crearEstudiante: ReturnType<
    typeof vi.fn<
      (solicitud: SolicitudCrearEstudiante) => Observable<RespuestaEstudiante>
    >
  >;
}

interface CarrerasServiceMock {
  listarCarreras: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosCarreras) => Observable<RespuestaCarreras>
    >
  >;
}

describe('CrearEstudianteComponent', () => {
  let fixture: ComponentFixture<CrearEstudianteComponent>;
  let componente: CrearEstudianteComponent;
  let estudiantesService: EstudiantesServiceMock;
  let carrerasService: CarrerasServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    estudiantesService = {
      crearEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante()),
      ),
    };
    carrerasService = {
      listarCarreras: vi.fn(() => respuestaObservable(crearRespuestaCarreras())),
    };
    navegarPorUrl = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [CrearEstudianteComponent],
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearEstudianteComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga carreras activas al iniciar', () => {
    expect(carrerasService.listarCarreras).toHaveBeenCalledTimes(1);
    expect(carrerasService.listarCarreras).toHaveBeenCalledWith({
      activo: true,
      limite: 100,
    });
    expect(componente.carreras()).toEqual([
      expect.objectContaining({ id: 2, nombre: 'Ingeniería de Software' }),
    ]);
  });

  it('envia el payload correcto al crear', () => {
    const solicitud = crearSolicitudEstudiante();

    componente.guardarEstudiante(solicitud);

    expect(estudiantesService.crearEstudiante).toHaveBeenCalledWith(solicitud);
  });

  it('navega al listado despues de crear', () => {
    componente.guardarEstudiante(crearSolicitudEstudiante());

    expect(navegarPorUrl).toHaveBeenCalledWith('/estudiantes');
  });

  it('muestra error del backend y conserva el formulario disponible', () => {
    estudiantesService.crearEstudiante.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          message: 'Registro duplicado.',
        },
      })),
    );

    componente.guardarEstudiante(crearSolicitudEstudiante());
    fixture.detectChanges();

    expect(componente.mensajeError()).toContain('Ya existe un estudiante');
    expect(navegarPorUrl).not.toHaveBeenCalled();
  });

  it('previene envios duplicados', () => {
    const solicitudPendiente = new Subject<RespuestaEstudiante>();

    estudiantesService.crearEstudiante.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    componente.guardarEstudiante(crearSolicitudEstudiante());
    componente.guardarEstudiante(crearSolicitudEstudiante());

    expect(estudiantesService.crearEstudiante).toHaveBeenCalledTimes(1);
  });

  it('cancelar vuelve al listado', () => {
    componente.cancelar();

    expect(navegarPorUrl).toHaveBeenCalledWith('/estudiantes');
  });
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

function crearSolicitudEstudiante(): SolicitudCrearEstudiante {
  return {
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
  };
}

function crearRespuestaEstudiante(): RespuestaEstudiante {
  return {
    success: true,
    message: 'Estudiante creado correctamente.',
    data: crearEstudiante(),
  };
}

function crearEstudiante(): Estudiante {
  return {
    id: 15,
    ...crearSolicitudEstudiante(),
    telefono: null,
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
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
      {
        id: 3,
        codigo: 'INA',
        nombre: 'Carrera inactiva',
        duracion_semestres: 8,
        facultad_id: 1,
        activo: false,
      },
    ],
    page: 1,
    limit: 100,
    total: 2,
    totalPages: 1,
  };
}
