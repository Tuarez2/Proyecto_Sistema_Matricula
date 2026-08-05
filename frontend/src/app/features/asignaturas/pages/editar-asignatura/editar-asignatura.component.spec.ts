import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  Asignatura,
  RespuestaAsignatura,
  SolicitudActualizarAsignatura,
} from '../../models/asignatura.model';
import { AsignaturasService } from '../../services/asignaturas.service';
import { EditarAsignaturaComponent } from './editar-asignatura.component';

interface AsignaturasServiceMock {
  obtenerAsignatura: ReturnType<
    typeof vi.fn<(idAsignatura: number) => Observable<RespuestaAsignatura>>
  >;
  actualizarAsignatura: ReturnType<
    typeof vi.fn<
      (
        idAsignatura: number,
        solicitud: SolicitudActualizarAsignatura,
      ) => Observable<RespuestaAsignatura>
    >
  >;
}

describe('EditarAsignaturaComponent', () => {
  let fixture: ComponentFixture<EditarAsignaturaComponent>;
  let componente: EditarAsignaturaComponent;
  let asignaturasService: AsignaturasServiceMock;
  let enrutador: Router;
  let parametroId: string;

  beforeEach(async () => {
    parametroId = '7';
    asignaturasService = {
      obtenerAsignatura: vi.fn(() =>
        respuestaObservable(crearRespuestaAsignatura()),
      ),
      actualizarAsignatura: vi.fn(() =>
        respuestaObservable(crearRespuestaAsignatura({ nombre: 'Programación II' })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EditarAsignaturaComponent],
      providers: [
        provideRouter([]),
        {
          provide: AsignaturasService,
          useValue: asignaturasService,
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

  it('consulta la asignatura usando el identificador de ruta', () => {
    crearComponente();

    expect(asignaturasService.obtenerAsignatura).toHaveBeenCalledWith(7);
  });

  it('puebla el formulario con la asignatura consultada', () => {
    crearComponente();

    expect(componente.formularioAsignatura.getRawValue()).toEqual({
      codigo: 'PRG1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
    });
  });

  it('maneja identificador inválido sin consultar la API', () => {
    parametroId = 'x';

    crearComponente();

    expect(asignaturasService.obtenerAsignatura).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'El identificador de la asignatura no es válido.',
    );
  });

  it('envía payload exacto y navega al listado', () => {
    crearComponente();
    componente.formularioAsignatura.setValue({
      codigo: 'prg2',
      nombre: 'Programación II',
      creditos: 5,
      nivel_academico: 2,
    });

    componente.guardarAsignatura();

    expect(asignaturasService.actualizarAsignatura).toHaveBeenCalledWith(7, {
      codigo: 'PRG2',
      nombre: 'Programación II',
      creditos: 5,
      nivel_academico: 2,
    });
    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/asignaturas');
  });

  it('rechaza formulario inválido', () => {
    crearComponente();
    asignaturasService.actualizarAsignatura.mockClear();
    componente.formularioAsignatura.controls.nombre.setValue('');

    componente.guardarAsignatura();

    expect(asignaturasService.actualizarAsignatura).not.toHaveBeenCalled();
    expect(componente.mensajeError()).toBe(
      'Revise los datos de la asignatura.',
    );
  });

  it('muestra error cuando la asignatura no existe', () => {
    asignaturasService.obtenerAsignatura.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('La asignatura solicitada no existe.');
  });

  it('muestra error de código duplicado al actualizar', () => {
    asignaturasService.actualizarAsignatura.mockReturnValueOnce(
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
    componente.guardarAsignatura();

    expect(componente.mensajeError()).toBe(
      'El código de asignatura ya está registrado.',
    );
  });

  it('evita doble envío', () => {
    const solicitudPendiente = new Subject<RespuestaAsignatura>();
    asignaturasService.actualizarAsignatura.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.guardarAsignatura();
    componente.guardarAsignatura();

    expect(asignaturasService.actualizarAsignatura).toHaveBeenCalledTimes(1);
  });

  it('cancela navegando al listado', () => {
    crearComponente();

    componente.cancelar();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/asignaturas');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(EditarAsignaturaComponent);
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

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 7,
    codigo: 'PRG1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...cambios,
  };
}

function crearRespuestaAsignatura(
  cambios: Partial<Asignatura> = {},
): RespuestaAsignatura {
  return {
    success: true,
    message: 'Asignatura actualizada correctamente.',
    data: crearAsignatura(cambios),
  };
}