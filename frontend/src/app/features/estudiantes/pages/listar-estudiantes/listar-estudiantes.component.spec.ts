import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type RespuestaEstudiante,
  type RespuestaListadoEstudiantes,
} from '../../models/estudiante.model';
import { EstudiantesService } from '../../services/estudiantes.service';
import { ListarEstudiantesComponent } from './listar-estudiantes.component';

interface EstudiantesServiceMock {
  listarEstudiantes: ReturnType<
    typeof vi.fn<() => Observable<RespuestaListadoEstudiantes>>
  >;
  cambiarEstadoEstudiante: ReturnType<
    typeof vi.fn<(idEstudiante: number) => Observable<RespuestaEstudiante>>
  >;
}

describe('ListarEstudiantesComponent', () => {
  let fixture: ComponentFixture<ListarEstudiantesComponent>;
  let componente: ListarEstudiantesComponent;
  let estudiantesService: EstudiantesServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    estudiantesService = {
      listarEstudiantes: vi.fn(() =>
        respuestaObservable(crearRespuestaListado([
          crearEstudiante({ id: 1, nombres: 'Ana' }),
          crearEstudiante({ id: 2, nombres: 'Luis', identificacion: '222' }),
        ])),
      ),
      cambiarEstadoEstudiante: vi.fn(() =>
        respuestaObservable(crearRespuestaEstudiante({
          estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO,
        })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListarEstudiantesComponent],
      providers: [
        provideRouter([]),
        {
          provide: EstudiantesService,
          useValue: estudiantesService,
        },
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
      ],
    }).compileComponents();
  });

  it('carga estudiantes al iniciar', () => {
    crearComponente();

    expect(estudiantesService.listarEstudiantes).toHaveBeenCalledTimes(1);
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('muestra estado vacio', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaListado([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron estudiantes.');
  });

  it('muestra error de API', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
  });

  it('filtra por busqueda', () => {
    crearComponente();

    componente.formularioFiltros.controls.busqueda.setValue('222');
    componente.buscarEstudiantes();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('restablece filtros', () => {
    crearComponente();

    componente.formularioFiltros.controls.busqueda.setValue('222');
    componente.buscarEstudiantes();
    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('cambia de pagina con el componente compartido', () => {
    estudiantesService.listarEstudiantes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaListado(
        Array.from({ length: 11 }, (_valor, indice) =>
          crearEstudiante({
            id: indice + 1,
            nombres: `Persona ${indice + 1}`,
            identificacion: String(indice + 1),
          }),
        ),
      )),
    );
    crearComponente();

    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Persona 11 Vera');
    expect(obtenerTexto()).not.toContain('Persona 1 Vera');
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Crear estudiante')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    crearComponente();

    expect(obtenerEnlace('Crear estudiante')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('confirma antes de inactivar y actualiza la fila despues de respuesta', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarEstudiante(componente.estudiantes()[0]);
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(estudiantesService.cambiarEstadoEstudiante).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Estudiante inactivado correctamente.');
    expect(componente.estudiantes()[0].estado_academico).toBe(
      ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO,
    );
  });

  it('no inactiva si el usuario cancela la confirmacion', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    componente.inactivarEstudiante(componente.estudiantes()[0]);

    expect(estudiantesService.cambiarEstadoEstudiante).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas mientras procesa estado', () => {
    const solicitudPendiente = new Subject<RespuestaEstudiante>();

    estudiantesService.cambiarEstadoEstudiante.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarEstudiante(componente.estudiantes()[0]);
    componente.inactivarEstudiante(componente.estudiantes()[1]);

    expect(estudiantesService.cambiarEstadoEstudiante).toHaveBeenCalledTimes(1);
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListarEstudiantesComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null;
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
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

function crearUsuario(codigoRol: string): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'activo',
    debe_cambiar_password: false,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

function crearEstudiante(cambios: Partial<Estudiante> = {}): Estudiante {
  return {
    id: 1,
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
    carrera: {
      id: 2,
      codigo: 'SIS',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: 1,
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaListado(
  estudiantes: Estudiante[],
): RespuestaListadoEstudiantes {
  return {
    success: true,
    data: estudiantes,
  };
}

function crearRespuestaEstudiante(
  cambios: Partial<Estudiante> = {},
): RespuestaEstudiante {
  return {
    success: true,
    message: 'Estudiante inactivado correctamente.',
    data: crearEstudiante({ id: 1, ...cambios }),
  };
}
