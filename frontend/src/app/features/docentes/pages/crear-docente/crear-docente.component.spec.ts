import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Docente,
  RespuestaDocente,
  SolicitudCrearDocente,
} from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';
import { CrearDocenteComponent } from './crear-docente.component';

interface DocentesServiceMock {
  crearDocente: ReturnType<
    typeof vi.fn<(solicitud: SolicitudCrearDocente) => Observable<RespuestaDocente>>
  >;
}

describe('CrearDocenteComponent', () => {
  let fixture: ComponentFixture<CrearDocenteComponent>;
  let componente: CrearDocenteComponent;
  let docentesService: DocentesServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    docentesService = {
      crearDocente: vi.fn(() => respuestaObservable(crearRespuestaDocente())),
    };
    navegarPorUrl = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [CrearDocenteComponent],
      providers: [
        provideRouter([]),
        {
          provide: DocentesService,
          useValue: docentesService,
        },
      ],
    }).compileComponents();

    const enrutador = TestBed.inject(Router);
    navegarPorUrl = vi
      .spyOn(enrutador, 'navigateByUrl')
      .mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(CrearDocenteComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('envia el payload correcto al crear', () => {
    const solicitud = crearSolicitudDocente();

    componente.guardarDocente(solicitud);

    expect(docentesService.crearDocente).toHaveBeenCalledWith(solicitud);
  });

  it('navega al listado despues de crear', () => {
    componente.guardarDocente(crearSolicitudDocente());

    expect(navegarPorUrl).toHaveBeenCalledWith('/docentes');
  });

  it('muestra error del backend y no navega', () => {
    docentesService.crearDocente.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          message: 'Registro duplicado.',
        },
      })),
    );

    componente.guardarDocente(crearSolicitudDocente());
    fixture.detectChanges();

    expect(componente.mensajeError()).toContain('Ya existe un docente');
    expect(navegarPorUrl).not.toHaveBeenCalled();
  });

  it('previene envios duplicados', () => {
    const solicitudPendiente = new Subject<RespuestaDocente>();

    docentesService.crearDocente.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    componente.guardarDocente(crearSolicitudDocente());
    componente.guardarDocente(crearSolicitudDocente());

    expect(docentesService.crearDocente).toHaveBeenCalledTimes(1);
  });

  it('cancelar vuelve al listado', () => {
    componente.cancelar();

    expect(navegarPorUrl).toHaveBeenCalledWith('/docentes');
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

function crearSolicitudDocente(): SolicitudCrearDocente {
  return {
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    especialidad: 'Matemática',
    activo: true,
  };
}

function crearRespuestaDocente(): RespuestaDocente {
  return {
    success: true,
    message: 'Docente creado correctamente.',
    data: crearDocente(),
  };
}

function crearDocente(): Docente {
  return {
    id: 15,
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    especialidad: 'Matemática',
    activo: true,
  };
}
