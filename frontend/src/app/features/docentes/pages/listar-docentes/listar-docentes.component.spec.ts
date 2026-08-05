import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import type {
  Docente,
  RespuestaDocente,
  RespuestaListadoDocentes,
} from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';
import { ListarDocentesComponent } from './listar-docentes.component';

interface DocentesServiceMock {
  listarDocentes: ReturnType<typeof vi.fn<() => Observable<RespuestaListadoDocentes>>>;
  cambiarEstadoDocente: ReturnType<
    typeof vi.fn<
      (idDocente: number, activo: boolean) => Observable<RespuestaDocente>
    >
  >;
}

describe('ListarDocentesComponent', () => {
  let fixture: ComponentFixture<ListarDocentesComponent>;
  let componente: ListarDocentesComponent;
  let docentesService: DocentesServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let navegar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    docentesService = {
      listarDocentes: vi.fn(() =>
        respuestaObservable(crearRespuestaListado([
          crearDocente({ id: 1, nombres: 'Ana', especialidad: 'Matemática' }),
          crearDocente({
            id: 2,
            nombres: 'Luis',
            identificacion: '222',
            especialidad: 'Programación',
          }),
        ])),
      ),
      cambiarEstadoDocente: vi.fn(() =>
        respuestaObservable(crearRespuestaDocente({ activo: false })),
      ),
    };
    navegar = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [ListarDocentesComponent],
      providers: [
        {
          provide: DocentesService,
          useValue: docentesService,
        },
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    const enrutador = TestBed.inject(Router);
    navegar = vi.spyOn(enrutador, 'navigate').mockResolvedValue(true);
  });

  it('carga docentes al iniciar', () => {
    crearComponente();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(1);
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('muestra estado vacio', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaListado([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron docentes.');
  });

  it('muestra error de API', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
  });

  it('filtra por busqueda', () => {
    crearComponente();

    componente.filtrar({ busqueda: '222' });
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('filtra por especialidad y estado', () => {
    crearComponente();

    componente.filtrar({ especialidad: 'Programación', activo: true });
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('restablece filtros desde el componente de filtros', () => {
    crearComponente();

    componente.filtrar({ busqueda: '222' });
    componente.filtrar({});
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
  });

  it('cambia de pagina con el componente compartido', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaListado(
        Array.from({ length: 11 }, (_valor, indice) =>
          crearDocente({
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

    expect(obtenerEnlace('Crear docente')).toBeTruthy();
    expect(obtenerBoton('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Crear docente')).toBeNull();
    expect(obtenerBoton('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('navega a edicion', () => {
    crearComponente();
    componente.editarDocente(componente.docentes()[0]);

    expect(navegar).toHaveBeenCalledWith(['/docentes/editar', 1]);
  });

  it('confirma antes de inactivar y actualiza la fila despues de respuesta', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(docentesService.cambiarEstadoDocente).toHaveBeenCalledWith(1, false);
    expect(obtenerTexto()).toContain('Operación completada.');
    expect(componente.docentes()[0].activo).toBe(false);
  });

  it('activa docentes inactivos con confirmacion', () => {
    docentesService.cambiarEstadoDocente.mockReturnValueOnce(
      respuestaObservable(crearRespuestaDocente({ activo: true })),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstadoDocente(crearDocente({ id: 3, activo: false }));

    expect(docentesService.cambiarEstadoDocente).toHaveBeenCalledWith(3, true);
  });

  it('no cambia estado si el usuario cancela la confirmacion', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);

    expect(docentesService.cambiarEstadoDocente).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas mientras procesa estado', () => {
    const solicitudPendiente = new Subject<RespuestaDocente>();

    docentesService.cambiarEstadoDocente.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);
    componente.cambiarEstadoDocente(componente.docentes()[1]);

    expect(docentesService.cambiarEstadoDocente).toHaveBeenCalledTimes(1);
  });

  it('muestra error al cambiar estado', () => {
    docentesService.cambiarEstadoDocente.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 403 })),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);

    expect(componente.mensajeError()).toBe(
      'No tiene permisos para gestionar docentes.',
    );
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListarDocentesComponent);
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

function crearDocente(cambios: Partial<Docente> = {}): Docente {
  return {
    id: 1,
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    especialidad: 'Matemática',
    activo: true,
    ...cambios,
  };
}

function crearRespuestaListado(docentes: Docente[]): RespuestaListadoDocentes {
  return {
    success: true,
    data: docentes,
  };
}

function crearRespuestaDocente(
  cambios: Partial<Docente> = {},
): RespuestaDocente {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearDocente({ id: 1, ...cambios }),
  };
}
