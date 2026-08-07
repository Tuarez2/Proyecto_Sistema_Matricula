import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Asignatura,
  RespuestaAsignatura,
  SolicitudCrearAsignatura,
} from '../../models/asignatura.model';
import { AsignaturasService } from '../../services/asignaturas.service';
import { CrearAsignaturaComponent } from './crear-asignatura.component';

interface AsignaturasServiceMock {
  crearAsignatura: ReturnType<
    typeof vi.fn<
      (solicitud: SolicitudCrearAsignatura) => Observable<RespuestaAsignatura>
    >
  >;
}

describe('CrearAsignaturaComponent', () => {
  let fixture: ComponentFixture<CrearAsignaturaComponent>;
  let componente: CrearAsignaturaComponent;
  let asignaturasService: AsignaturasServiceMock;
  let enrutador: Router;

  beforeEach(async () => {
    asignaturasService = {
      crearAsignatura: vi.fn(() =>
        respuestaObservable(crearRespuestaAsignatura()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CrearAsignaturaComponent],
      providers: [
        provideRouter([]),
        {
          provide: AsignaturasService,
          useValue: asignaturasService,
        },
      ],
    }).compileComponents();

    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('rechaza formulario inválido', () => {
    crearComponente();

    componente.guardarAsignatura();
    fixture.detectChanges();

    expect(asignaturasService.crearAsignatura).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los datos de la asignatura.');
  });

  it('envía payload exacto y navega al listado', () => {
    crearComponente();
    completarFormulario();

    componente.guardarAsignatura();

    expect(asignaturasService.crearAsignatura).toHaveBeenCalledWith({
      codigo: 'PRG1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
    });
    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/asignaturas');
  });

  it('muestra error de código duplicado y conserva valores', () => {
    asignaturasService.crearAsignatura.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 409,
          error: {
            success: false,
            code: 'UNIQUE_CONSTRAINT_ERROR',
            message: 'El registro ya existe.',
          },
        }),
      ),
    );

    crearComponente();
    completarFormulario();
    componente.guardarAsignatura();

    expect(componente.mensajeError()).toBe(
      'El código de asignatura ya está registrado.',
    );
    expect(componente.formularioAsignatura.controls.nombre.value).toBe(
      'Programación I',
    );
  });

  it('muestra error de datos inválidos del backend', () => {
    asignaturasService.crearAsignatura.mockReturnValueOnce(
      errorObservable(
        new HttpErrorResponse({
          status: 400,
          error: {
            success: false,
            code: 'REQUEST_VALIDATION_ERROR',
            message: 'Error de validacion.',
          },
        }),
      ),
    );

    crearComponente();
    completarFormulario();
    componente.guardarAsignatura();

    expect(componente.mensajeError()).toBe(
      'Revise los datos de la asignatura.',
    );
  });

  it('muestra error de servidor al guardar', () => {
    asignaturasService.crearAsignatura.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 500 })),
    );

    crearComponente();
    completarFormulario();
    componente.guardarAsignatura();

    expect(componente.mensajeError()).toBe(
      'Ocurrió un error del servidor al guardar la asignatura.',
    );
  });

  it('evita doble envío', () => {
    const solicitudPendiente = new Subject<RespuestaAsignatura>();
    asignaturasService.crearAsignatura.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    completarFormulario();
    componente.guardarAsignatura();
    componente.guardarAsignatura();

    expect(asignaturasService.crearAsignatura).toHaveBeenCalledTimes(1);
  });

  it('cancela navegando al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/asignaturas');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(CrearAsignaturaComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function completarFormulario(): void {
    componente.formularioAsignatura.setValue({
      codigo: 'prg1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
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

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 1,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    ...cambios,
  };
}

function crearRespuestaAsignatura(
  cambios: Partial<Asignatura> = {},
): RespuestaAsignatura {
  return {
    success: true,
    message: 'Asignatura creada correctamente.',
    data: crearAsignatura(cambios),
  };
}