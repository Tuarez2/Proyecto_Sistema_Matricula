import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Facultad,
  FiltrosFacultades,
  RespuestaListadoFacultades,
} from '../../../facultades/models/facultad.model';
import { FacultadesService } from '../../../facultades/services/facultades.service';
import type {
  Carrera,
  RespuestaCarrera,
  SolicitudCrearCarrera,
} from '../../models/carrera.model';
import { CarrerasService } from '../../services/carreras.service';
import { CrearCarreraComponent } from './crear-carrera.component';

interface CarrerasServiceMock {
  crearCarrera: ReturnType<
    typeof vi.fn<(solicitud: SolicitudCrearCarrera) => Observable<RespuestaCarrera>>
  >;
}

interface FacultadesServiceMock {
  listarFacultades: ReturnType<
    typeof vi.fn<(filtros?: FiltrosFacultades) => Observable<RespuestaListadoFacultades>>
  >;
}

describe('CrearCarreraComponent', () => {
  let fixture: ComponentFixture<CrearCarreraComponent>;
  let componente: CrearCarreraComponent;
  let carrerasService: CarrerasServiceMock;
  let facultadesService: FacultadesServiceMock;
  let enrutador: Router;

  beforeEach(async () => {
    carrerasService = {
      crearCarrera: vi.fn(() => respuestaObservable(crearRespuestaCarrera())),
    };
    facultadesService = {
      listarFacultades: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultades()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CrearCarreraComponent],
      providers: [
        provideRouter([]),
        {
          provide: CarrerasService,
          useValue: carrerasService,
        },
        {
          provide: FacultadesService,
          useValue: facultadesService,
        },
      ],
    }).compileComponents();

    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('carga facultades reales al iniciar', () => {
    crearComponente();

    expect(facultadesService.listarFacultades).toHaveBeenCalledWith({
      limite: 100,
    });
    expect(obtenerTexto()).toContain('SIS - Sistemas');
    expect(obtenerTexto()).toContain('DER - Derecho (inactiva)');
  });

  it('muestra error si falla el catálogo de facultades', () => {
    facultadesService.listarFacultades.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 500 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible cargar el catálogo de facultades.',
    );
  });

  it('rechaza formulario inválido', () => {
    crearComponente();

    componente.guardarCarrera();
    fixture.detectChanges();

    expect(carrerasService.crearCarrera).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los datos de la carrera.');
  });

  it('envía payload exacto con facultad_id y navega al listado', () => {
    crearComponente();
    completarFormulario();

    componente.guardarCarrera();

    expect(carrerasService.crearCarrera).toHaveBeenCalledWith({
      codigo: 'SOF',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: 2,
      activo: true,
    });
    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/carreras');
  });

  it('muestra error de código duplicado y conserva valores', () => {
    carrerasService.crearCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'UNIQUE_CONSTRAINT_ERROR',
          message: 'El registro ya existe.',
        },
      })),
    );

    crearComponente();
    completarFormulario();
    componente.guardarCarrera();

    expect(componente.mensajeError()).toBe(
      'El código de carrera ya está registrado.',
    );
    expect(componente.formularioCarrera.controls.nombre.value).toBe(
      'Ingeniería de Software',
    );
  });

  it('muestra error de facultad inexistente', () => {
    carrerasService.crearCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          code: 'FACULTAD_NOT_FOUND',
          message: 'La facultad especificada no existe.',
        },
      })),
    );

    crearComponente();
    completarFormulario();
    componente.guardarCarrera();

    expect(componente.mensajeError()).toBe('La facultad especificada no existe.');
  });

  it('evita doble envío', () => {
    const solicitudPendiente = new Subject<RespuestaCarrera>();
    carrerasService.crearCarrera.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    completarFormulario();
    componente.guardarCarrera();
    componente.guardarCarrera();

    expect(carrerasService.crearCarrera).toHaveBeenCalledTimes(1);
  });

  it('cancela navegando al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/carreras');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(CrearCarreraComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function completarFormulario(): void {
    componente.formularioCarrera.setValue({
      codigo: 'sof',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: '2',
      activo: true,
    });
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

function crearFacultad(cambios: Partial<Facultad> = {}): Facultad {
  return {
    id: 2,
    codigo: 'SIS',
    nombre: 'Sistemas',
    activo: true,
    ...cambios,
  };
}

function crearCarrera(cambios: Partial<Carrera> = {}): Carrera {
  return {
    id: 1,
    codigo: 'SOF',
    nombre: 'Ingeniería de Software',
    duracion_semestres: 8,
    facultad_id: 2,
    activo: true,
    ...cambios,
  };
}

function crearRespuestaFacultades(): RespuestaListadoFacultades {
  return {
    success: true,
    data: [
      crearFacultad(),
      crearFacultad({ id: 4, codigo: 'DER', nombre: 'Derecho', activo: false }),
    ],
    page: 1,
    limit: 100,
    total: 2,
    totalPages: 1,
  };
}

function crearRespuestaCarrera(
  cambios: Partial<Carrera> = {},
): RespuestaCarrera {
  return {
    success: true,
    message: 'Carrera creada correctamente.',
    data: crearCarrera(cambios),
  };
}
