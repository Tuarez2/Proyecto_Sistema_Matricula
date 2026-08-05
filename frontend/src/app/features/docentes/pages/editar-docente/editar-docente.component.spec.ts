import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { DocenteFormComponent } from '../../components/docente-form/docente-form.component';
import type {
  Docente,
  RespuestaDocente,
  SolicitudActualizarDocente,
} from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';
import { EditarDocenteComponent } from './editar-docente.component';

interface DocentesServiceMock {
  obtenerDocente: ReturnType<
    typeof vi.fn<(idDocente: number) => Observable<RespuestaDocente>>
  >;
  actualizarDocente: ReturnType<
    typeof vi.fn<
      (
        idDocente: number,
        solicitud: SolicitudActualizarDocente,
      ) => Observable<RespuestaDocente>
    >
  >;
}

describe('EditarDocenteComponent', () => {
  let fixture: ComponentFixture<EditarDocenteComponent>;
  let componente: EditarDocenteComponent;
  let docentesService: DocentesServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;
  let parametroId = '15';

  beforeEach(async () => {
    parametroId = '15';
    docentesService = {
      obtenerDocente: vi.fn(() =>
        respuestaObservable(crearRespuestaDocente()),
      ),
      actualizarDocente: vi.fn(() =>
        respuestaObservable(crearRespuestaDocente({
          correo: 'actualizado@universidad.edu',
        })),
      ),
    };
    navegarPorUrl = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [EditarDocenteComponent],
      providers: [
        {
          provide: DocentesService,
          useValue: docentesService,
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

  it('lee el ID de la ruta y carga el docente', () => {
    crearComponente();

    expect(docentesService.obtenerDocente).toHaveBeenCalledWith(15);
    expect(componente.docente()?.identificacion).toBe('1002003004');
  });

  it('puebla el formulario con el docente consultado', () => {
    crearComponente();

    const formulario = obtenerFormulario();

    expect(formulario.formularioDocente.controls.identificacion.value).toBe(
      '1002003004',
    );
    expect(formulario.formularioDocente.controls.especialidad.value).toBe(
      'Matemática',
    );
  });

  it('muestra error si el ID no es valido', () => {
    parametroId = 'abc';

    crearComponente();

    expect(docentesService.obtenerDocente).not.toHaveBeenCalled();
    expect(componente.mensajeError()).toBe(
      'El identificador del docente no es válido.',
    );
  });

  it('maneja recurso inexistente', () => {
    docentesService.obtenerDocente.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();

    expect(componente.mensajeError()).toBe('El docente no existe.');
  });

  it('actualiza con el payload recibido del formulario', () => {
    crearComponente();
    const solicitud: SolicitudActualizarDocente = {
      correo: 'actualizado@universidad.edu',
      telefono: null,
    };

    componente.guardarDocente(solicitud);

    expect(docentesService.actualizarDocente).toHaveBeenCalledWith(
      15,
      solicitud,
    );
  });

  it('navega al listado despues de actualizar', () => {
    crearComponente();

    componente.guardarDocente({ correo: 'actualizado@universidad.edu' });

    expect(navegarPorUrl).toHaveBeenCalledWith('/docentes');
  });

  it('muestra error del backend al actualizar', () => {
    docentesService.actualizarDocente.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          code: 'EMPTY_UPDATE_PAYLOAD',
          message: 'Payload vacío.',
        },
      })),
    );
    crearComponente();

    componente.guardarDocente({});

    expect(componente.mensajeError()).toBe('Debe enviar al menos un campo válido.');
  });

  it('previene envios duplicados', () => {
    const solicitudPendiente = new Subject<RespuestaDocente>();

    docentesService.actualizarDocente.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    crearComponente();
    componente.guardarDocente({ correo: 'actualizado@universidad.edu' });
    componente.guardarDocente({ correo: 'otro@universidad.edu' });

    expect(docentesService.actualizarDocente).toHaveBeenCalledTimes(1);
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(EditarDocenteComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerFormulario(): DocenteFormComponent {
    const depuracion = fixture.debugElement.query(
      By.directive(DocenteFormComponent),
    );

    if (!depuracion) {
      throw new Error('No existe el formulario de docente.');
    }

    return depuracion.componentInstance as DocenteFormComponent;
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

function crearDocente(cambios: Partial<Docente> = {}): Docente {
  return {
    id: 15,
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    especialidad: 'Matemática',
    activo: true,
    ...cambios,
  };
}

function crearRespuestaDocente(
  cambios: Partial<Docente> = {},
): RespuestaDocente {
  return {
    success: true,
    message: 'Docente actualizado correctamente.',
    data: crearDocente(cambios),
  };
}
