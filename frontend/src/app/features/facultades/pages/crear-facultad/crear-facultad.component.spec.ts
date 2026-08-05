import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Facultad,
  RespuestaFacultad,
  SolicitudCrearFacultad,
} from '../../models/facultad.model';
import { FacultadesService } from '../../services/facultades.service';
import { CrearFacultadComponent } from './crear-facultad.component';

interface FacultadesServiceMock {
  crearFacultad: ReturnType<
    typeof vi.fn<
      (solicitud: SolicitudCrearFacultad) => Observable<RespuestaFacultad>
    >
  >;
}

describe('CrearFacultadComponent', () => {
  let fixture: ComponentFixture<CrearFacultadComponent>;
  let componente: CrearFacultadComponent;
  let facultadesService: FacultadesServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    facultadesService = {
      crearFacultad: vi.fn(() =>
        respuestaObservable(crearRespuestaFacultad()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CrearFacultadComponent],
      providers: [
        provideRouter([]),
        {
          provide: FacultadesService,
          useValue: facultadesService,
        },
      ],
    }).compileComponents();

    const enrutador = TestBed.inject(Router);
    navegarPorUrl = vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(CrearFacultadComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra validaciones cuando el formulario está incompleto', () => {
    componente.guardarFacultad();
    fixture.detectChanges();

    expect(facultadesService.crearFacultad).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los datos de la facultad.');
    expect(obtenerTexto()).toContain('El código es obligatorio.');
    expect(obtenerTexto()).toContain('El nombre es obligatorio.');
  });

  it('envía el payload exacto al crear', () => {
    completarFormulario();

    componente.guardarFacultad();

    expect(facultadesService.crearFacultad).toHaveBeenCalledWith({
      codigo: 'SIS',
      nombre: 'Sistemas',
      activo: true,
    });
  });

  it('navega al listado después de crear', () => {
    completarFormulario();

    componente.guardarFacultad();

    expect(navegarPorUrl).toHaveBeenCalledWith('/facultades');
  });

  it('muestra error de código duplicado y conserva el formulario', () => {
    facultadesService.crearFacultad.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'FACULTAD_CODIGO_DUPLICATED',
          message: 'Código duplicado.',
        },
      })),
    );
    completarFormulario();

    componente.guardarFacultad();

    expect(componente.mensajeError()).toBe(
      'El código de facultad ya está registrado.',
    );
    expect(componente.formularioFacultad.getRawValue()).toEqual({
      codigo: 'sis',
      nombre: 'Sistemas',
      activo: true,
    });
    expect(navegarPorUrl).not.toHaveBeenCalled();
  });

  it('muestra errores de validación del backend', () => {
    facultadesService.crearFacultad.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          message: 'El codigo tiene una longitud invalida.',
        },
      })),
    );
    completarFormulario();

    componente.guardarFacultad();

    expect(componente.mensajeError()).toBe(
      'El codigo tiene una longitud invalida.',
    );
  });

  it('previene envíos duplicados', () => {
    const solicitudPendiente = new Subject<RespuestaFacultad>();

    facultadesService.crearFacultad.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    completarFormulario();

    componente.guardarFacultad();
    componente.guardarFacultad();

    expect(facultadesService.crearFacultad).toHaveBeenCalledTimes(1);
  });

  it('cancelar vuelve al listado', () => {
    componente.cancelar();

    expect(navegarPorUrl).toHaveBeenCalledWith('/facultades');
  });

  function completarFormulario(): void {
    componente.formularioFacultad.controls.codigo.setValue('sis');
    componente.formularioFacultad.controls.nombre.setValue('Sistemas');
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
    message: 'Facultad creada correctamente.',
    data: crearFacultad(cambios),
  };
}
