import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
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
  SolicitudActualizarCarrera,
} from '../../models/carrera.model';
import { CarrerasService } from '../../services/carreras.service';
import { EditarCarreraComponent } from './editar-carrera.component';

interface CarrerasServiceMock {
  obtenerCarrera: ReturnType<
    typeof vi.fn<(idCarrera: number) => Observable<RespuestaCarrera>>
  >;
  actualizarCarrera: ReturnType<
    typeof vi.fn<
      (
        idCarrera: number,
        solicitud: SolicitudActualizarCarrera,
      ) => Observable<RespuestaCarrera>
    >
  >;
}

interface FacultadesServiceMock {
  listarFacultades: ReturnType<
    typeof vi.fn<(filtros?: FiltrosFacultades) => Observable<RespuestaListadoFacultades>>
  >;
}

describe('EditarCarreraComponent', () => {
  let fixture: ComponentFixture<EditarCarreraComponent>;
  let componente: EditarCarreraComponent;
  let carrerasService: CarrerasServiceMock;
  let facultadesService: FacultadesServiceMock;
  let enrutador: Router;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '7';
    carrerasService = {
      obtenerCarrera: vi.fn(() => respuestaObservable(crearRespuestaCarrera())),
      actualizarCarrera: vi.fn(() =>
        respuestaObservable(crearRespuestaCarrera({ nombre: 'Software 2' })),
      ),
    };
    facultadesService = {
      listarFacultades: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultades()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EditarCarreraComponent],
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

    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('consulta carrera y facultades usando el identificador de ruta', () => {
    crearComponente();

    expect(carrerasService.obtenerCarrera).toHaveBeenCalledWith(7);
    expect(facultadesService.listarFacultades).toHaveBeenCalledWith({
      limite: 100,
    });
  });

  it('puebla el formulario con la carrera consultada', () => {
    crearComponente();

    expect(componente.formularioCarrera.getRawValue()).toEqual({
      codigo: 'SOF',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: '2',
      activo: true,
    });
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(carrerasService.obtenerCarrera).not.toHaveBeenCalled();
    expect(facultadesService.listarFacultades).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('El identificador de la carrera no es válido.');
  });

  it('conserva la facultad actual si no viene en el catálogo', () => {
    carrerasService.obtenerCarrera.mockReturnValueOnce(
      respuestaObservable(crearRespuestaCarrera({
        facultad_id: 9,
        facultad: {
          id: 9,
          codigo: 'OLD',
          nombre: 'Facultad inactiva',
          activo: false,
        },
      })),
    );

    crearComponente();

    expect(componente.facultades().some((facultad) => facultad.id === 9)).toBe(
      true,
    );
    expect(obtenerTexto()).toContain('OLD - Facultad inactiva (inactiva)');
  });

  it('envía payload exacto con facultad_id y navega al listado', () => {
    crearComponente();
    componente.formularioCarrera.setValue({
      codigo: 'sof2',
      nombre: 'Software 2',
      duracion_semestres: 9,
      facultad_id: '3',
      activo: false,
    });

    componente.guardarCarrera();

    expect(carrerasService.actualizarCarrera).toHaveBeenCalledWith(7, {
      codigo: 'SOF2',
      nombre: 'Software 2',
      duracion_semestres: 9,
      facultad_id: 3,
      activo: false,
    });
    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/carreras');
  });

  it('rechaza formulario inválido', () => {
    crearComponente();
    carrerasService.actualizarCarrera.mockClear();
    componente.formularioCarrera.controls.nombre.setValue('');

    componente.guardarCarrera();

    expect(carrerasService.actualizarCarrera).not.toHaveBeenCalled();
    expect(componente.mensajeError()).toBe('Revise los datos de la carrera.');
  });

  it('muestra error cuando la carrera no existe', () => {
    carrerasService.obtenerCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('La carrera solicitada no existe.');
  });

  it('muestra error de facultad inexistente al actualizar', () => {
    carrerasService.actualizarCarrera.mockReturnValueOnce(
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
    componente.guardarCarrera();

    expect(componente.mensajeError()).toBe('La facultad especificada no existe.');
  });

  it('evita doble envío', () => {
    const solicitudPendiente = new Subject<RespuestaCarrera>();
    carrerasService.actualizarCarrera.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.guardarCarrera();
    componente.guardarCarrera();

    expect(carrerasService.actualizarCarrera).toHaveBeenCalledTimes(1);
  });

  it('cancela navegando al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/carreras');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(EditarCarreraComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
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
    ...cambios,
  };
}

function crearRespuestaFacultades(): RespuestaListadoFacultades {
  return {
    success: true,
    data: [
      crearFacultad(),
      crearFacultad({ id: 3, codigo: 'MED', nombre: 'Medicina' }),
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
    message: 'Carrera actualizada correctamente.',
    data: crearCarrera(cambios),
  };
}
