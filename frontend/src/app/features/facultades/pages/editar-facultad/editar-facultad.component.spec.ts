import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Facultad,
  RespuestaFacultad,
  SolicitudActualizarFacultad,
} from '../../models/facultad.model';
import { FacultadesService } from '../../services/facultades.service';
import { EditarFacultadComponent } from './editar-facultad.component';

interface FacultadesServiceMock {
  obtenerFacultad: ReturnType<
    typeof vi.fn<(idFacultad: number) => Observable<RespuestaFacultad>>
  >;
  actualizarFacultad: ReturnType<
    typeof vi.fn<
      (
        idFacultad: number,
        solicitud: SolicitudActualizarFacultad,
      ) => Observable<RespuestaFacultad>
    >
  >;
}

describe('EditarFacultadComponent', () => {
  let fixture: ComponentFixture<EditarFacultadComponent>;
  let componente: EditarFacultadComponent;
  let facultadesService: FacultadesServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '15';
    facultadesService = {
      obtenerFacultad: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultad()),
      ),
      actualizarFacultad: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultad({
          nombre: 'Sistemas Actualizada',
        })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EditarFacultadComponent],
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

    const enrutador = TestBed.inject(Router);
    navegarPorUrl = vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('lee el ID de la ruta y consulta la facultad', () => {
    crearComponente();

    expect(facultadesService.obtenerFacultad).toHaveBeenCalledWith(15);
  });

  it('puebla el formulario con la facultad recibida', () => {
    crearComponente();

    expect(componente.formularioFacultad.getRawValue()).toEqual({
      codigo: 'SIS',
      nombre: 'Sistemas',
    });
    expect(obtenerTexto()).toContain('Estado actual: Activa');
  });

  it('muestra error con ID inválido sin consultar la API', () => {
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

  it('envía el payload exacto al actualizar', () => {
    crearComponente();
    componente.formularioFacultad.controls.codigo.setValue('med');
    componente.formularioFacultad.controls.nombre.setValue('Medicina');

    componente.guardarFacultad();

    expect(facultadesService.actualizarFacultad).toHaveBeenCalledWith(15, {
      codigo: 'MED',
      nombre: 'Medicina',
    });
  });

  it('navega al listado después de actualizar', () => {
    crearComponente();

    componente.guardarFacultad();

    expect(navegarPorUrl).toHaveBeenCalledWith('/facultades');
  });

  it('muestra validaciones de formulario inválido', () => {
    crearComponente();
    componente.formularioFacultad.controls.codigo.setValue('');

    componente.guardarFacultad();
    fixture.detectChanges();

    expect(facultadesService.actualizarFacultad).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('El código es obligatorio.');
  });

  it('muestra error de nombre duplicado', () => {
    facultadesService.actualizarFacultad.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'FACULTAD_NOMBRE_DUPLICATED',
          message: 'Nombre duplicado.',
        },
      })),
    );
    crearComponente();

    componente.guardarFacultad();

    expect(componente.mensajeError()).toBe(
      'El nombre de facultad ya está registrado.',
    );
  });

  it('previene envíos duplicados', () => {
    const solicitudPendiente = new Subject<RespuestaFacultad>();

    facultadesService.actualizarFacultad.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    crearComponente();

    componente.guardarFacultad();
    componente.guardarFacultad();

    expect(facultadesService.actualizarFacultad).toHaveBeenCalledTimes(1);
  });

  it('cancelar vuelve al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(navegarPorUrl).toHaveBeenCalledWith('/facultades');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(EditarFacultadComponent);
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
    id: 15,
    codigo: 'SIS',
    nombre: 'Sistemas',
    activo: true,
    ...cambios,
  };
}

function crearRespuestaFacultad(
  cambios: Partial<Facultad> = {},
): RespuestaFacultad {
  return {
    success: true,
    message: 'Facultad actualizada correctamente.',
    data: crearFacultad(cambios),
  };
}
