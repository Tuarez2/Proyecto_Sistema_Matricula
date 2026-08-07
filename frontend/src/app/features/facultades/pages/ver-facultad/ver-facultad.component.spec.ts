import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import type { Facultad, RespuestaFacultad } from '../../models/facultad.model';
import { FacultadesService } from '../../services/facultades.service';
import { VerFacultadComponent } from './ver-facultad.component';

interface FacultadesServiceMock {
  obtenerFacultad: ReturnType<
    typeof vi.fn<(idFacultad: number) => Observable<RespuestaFacultad>>
  >;
}

describe('VerFacultadComponent', () => {
  let fixture: ComponentFixture<VerFacultadComponent>;
  let facultadesService: FacultadesServiceMock;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '15';
    facultadesService = {
      obtenerFacultad: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultad()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [VerFacultadComponent],
      providers: [
        provideRouter([]),
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
  });

  it('consulta la facultad usando el identificador de ruta', () => {
    crearComponente();

    expect(facultadesService.obtenerFacultad).toHaveBeenCalledWith(15);
  });

  it('renderiza el detalle y las carreras asociadas', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('SIS');
    expect(obtenerTexto()).toContain('Sistemas');
    expect(obtenerTexto()).toContain('Activa');
    expect(obtenerTexto()).toContain('Ingeniería de Software');
  });

  it('muestra estado vacío de carreras asociadas', () => {
    facultadesService.obtenerFacultad.mockReturnValueOnce(
      respuestaObservable(crearRespuestaFacultad({ carreras: [] })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No hay carreras asociadas a esta facultad.',
    );
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(facultadesService.obtenerFacultad).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador de la facultad no es válido.',
    );
  });

  it('muestra error cuando la facultad no existe', () => {
    facultadesService.obtenerFacultad.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('La facultad solicitada no existe.');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(VerFacultadComponent);
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
    id: 15,
    codigo: 'SIS',
    nombre: 'Sistemas',
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    carreras: [
      {
        id: 2,
        codigo: 'SOF',
        nombre: 'Ingeniería de Software',
        duracion_semestres: 8,
        activo: true,
      },
    ],
    ...cambios,
  };
}

function crearRespuestaFacultad(
  cambios: Partial<Facultad> = {},
): RespuestaFacultad {
  return {
    success: true,
    data: crearFacultad(cambios),
  };
}
