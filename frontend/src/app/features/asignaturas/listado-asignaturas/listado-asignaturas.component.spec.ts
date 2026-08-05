import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  Asignatura,
  RespuestaCambioEstadoAsignatura,
  RespuestaListadoAsignaturas,
} from '../models/asignatura.model';
import { AsignaturasService } from '../services/asignaturas.service';
import { ListadoAsignaturasComponent } from './listado-asignaturas.component';

interface AsignaturasServiceMock {
  listarAsignaturas: ReturnType<
    typeof vi.fn<() => Observable<RespuestaListadoAsignaturas>>
  >;
  inactivarAsignatura: ReturnType<
    typeof vi.fn<
      (idAsignatura: number) => Observable<RespuestaCambioEstadoAsignatura>
    >
  >;
}

describe('ListadoAsignaturasComponent', () => {
  let fixture: ComponentFixture<ListadoAsignaturasComponent>;
  let componente: ListadoAsignaturasComponent;
  let asignaturasService: AsignaturasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    asignaturasService = {
      listarAsignaturas: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignaturas([
            crearAsignatura({ id: 1, codigo: 'PRG1', nombre: 'Programación I' }),
            crearAsignatura({
              id: 2,
              codigo: 'MATE1',
              nombre: 'Matemática I',
              nivel_academico: 1,
            }),
          ]),
        ),
      ),
      inactivarAsignatura: vi.fn(() =>
        respuestaObservable(crearRespuestaCambioEstado({ activo: false })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoAsignaturasComponent],
      providers: [
        provideRouter([]),
        {
          provide: AsignaturasService,
          useValue: asignaturasService,
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

  it('carga asignaturas al iniciar', () => {
    crearComponente();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('Matemática I');
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      respuestaObservable(crearRespuestaAsignaturas([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron asignaturas.');
  });

  it('muestra error de API al cargar asignaturas', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('filtra localmente por código, nombre y estado', () => {
    crearComponente();

    componente.filtros.controls.codigo.setValue('prg');
    componente.filtros.controls.nombre.setValue('programación');
    componente.filtros.controls.activo.setValue('true');
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(obtenerTexto()).toContain('Programación I');
    expect(componente.asignaturasPagina()).toEqual([
      expect.objectContaining({ nombre: 'Programación I' }),
    ]);
  });

  it('rechaza filtros inválidos sin volver a consultar la API', () => {
    crearComponente();
    asignaturasService.listarAsignaturas.mockClear();

    componente.filtros.controls.nombre.setValue('x'.repeat(151));
    componente.buscarAsignaturas();
    fixture.detectChanges();

    expect(asignaturasService.listarAsignaturas).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Revise los filtros ingresados.');
  });

  it('limpia filtros y vuelve a mostrar todos los registros', () => {
    crearComponente();

    componente.filtros.controls.nombre.setValue('Programación I');
    componente.buscarAsignaturas();
    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('Matemática I');
  });

  it('pagina localmente cuando el backend devuelve todos los registros', () => {
    asignaturasService.listarAsignaturas.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaAsignaturas(
          Array.from({ length: 11 }, (_, indice) =>
            crearAsignatura({
              id: indice + 1,
              codigo: `ASG${indice + 1}`,
              nombre: `Asignatura ${indice + 1}`,
            }),
          ),
        ),
      ),
    );

    crearComponente();
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.asignaturasPagina().length).toBe(1);
    expect(obtenerTexto()).toContain('Asignatura 11');
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Crear asignatura')).toBeTruthy();
    expect(obtenerEnlace('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones administrativas', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();

    expect(obtenerEnlace('Crear asignatura')).toBeNull();
    expect(obtenerEnlace('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('enlaza cada asignatura con detalle y edición', () => {
    crearComponente();

    expect(obtenerEnlace('Ver')?.getAttribute('href')).toBe('/asignaturas/1');
    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/asignaturas/editar/1',
    );
  });

  it('confirma antes de inactivar una asignatura', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(asignaturasService.inactivarAsignatura).toHaveBeenCalledWith(1);
    expect(obtenerTexto()).toContain('Asignatura inactivada correctamente.');
    expect(asignaturasService.listarAsignaturas).toHaveBeenCalledTimes(2);
  });

  it('no inactiva si se cancela la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);

    expect(asignaturasService.inactivarAsignatura).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas al inactivar', () => {
    const solicitudPendiente =
      new Subject<RespuestaCambioEstadoAsignatura>();

    asignaturasService.inactivarAsignatura.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);
    componente.inactivarAsignatura(componente.asignaturas()[1]);

    expect(asignaturasService.inactivarAsignatura).toHaveBeenCalledTimes(1);
  });

  it('muestra error de operación al inactivar', () => {
    asignaturasService.inactivarAsignatura.mockReturnValueOnce(
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
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    componente.inactivarAsignatura(componente.asignaturas()[0]);

    expect(componente.mensajeError()).toBe(
      'El código de asignatura ya está registrado.',
    );
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListadoAsignaturasComponent);
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

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 1,
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

function crearRespuestaAsignaturas(
  asignaturas: Asignatura[],
): RespuestaListadoAsignaturas {
  return {
    success: true,
    data: asignaturas,
  };
}

function crearRespuestaCambioEstado(
  cambios: Partial<Asignatura>,
): RespuestaCambioEstadoAsignatura {
  return {
    success: true,
    message: 'Asignatura inactivada correctamente.',
    data: crearAsignatura({ id: 1, ...cambios }),
  };
}