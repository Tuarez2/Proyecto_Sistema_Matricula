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
  FiltrosAsignaturas,
  RespuestaListadoAsignaturas,
} from '../../asignaturas/models/asignatura.model';
import { AsignaturasService } from '../../asignaturas/services/asignaturas.service';
import type {
  Carrera,
  FiltrosCarreras,
  RespuestaListadoCarreras,
} from '../../carreras/models/carrera.model';
import { CarrerasService } from '../../carreras/services/carreras.service';
import type {
  RespuestaAsignacion,
  RespuestaAsignaturasCarrera,
  SolicitudActualizarRelacion,
  SolicitudAgregarAsignatura,
} from '../models/malla-curricular.model';
import { MallaCurricularService } from '../services/malla-curricular.service';
import { GestionMallaComponent } from './gestion-malla.component';

interface MallaServiceMock {
  consultarAsignaturasCarrera: ReturnType<
    typeof vi.fn<
      (
        carreraId: number,
        pagina?: number,
        limite?: number,
      ) => Observable<RespuestaAsignaturasCarrera>
    >
  >;
  asignarAsignatura: ReturnType<
    typeof vi.fn<
      (solicitud: SolicitudAgregarAsignatura) => Observable<RespuestaAsignacion>
    >
  >;
  actualizarRelacion: ReturnType<
    typeof vi.fn<
      (
        idAsignacion: string,
        solicitud: SolicitudActualizarRelacion,
      ) => Observable<RespuestaAsignacion>
    >
  >;
  quitarAsignatura: ReturnType<
    typeof vi.fn<
      (idAsignacion: string) => Observable<RespuestaAsignacion>
    >
  >;
  construirIdAsignacion: ReturnType<
    typeof vi.fn<(carreraId: number, asignaturaId: number) => string>
  >;
}

interface CarrerasServiceMock {
  listarCarreras: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosCarreras) => Observable<RespuestaListadoCarreras>
    >
  >;
}

interface AsignaturasServiceMock {
  listarAsignaturas: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosAsignaturas) => Observable<RespuestaListadoAsignaturas>
    >
  >;
}

describe('GestionMallaComponent', () => {
  let fixture: ComponentFixture<GestionMallaComponent>;
  let componente: GestionMallaComponent;
  let servicioMalla: MallaServiceMock;
  let carrerasServicio: CarrerasServiceMock;
  let asignaturasServicio: AsignaturasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    servicioMalla = {
      consultarAsignaturasCarrera: vi.fn(() =>
        respuestaObservable(crearRespuestaAsignaturasCarrera([
          crearAsignatura(),
          crearAsignatura({
            id: 4,
            codigo: 'PRO2',
            nombre: 'Programación II',
            nivel_academico: 2,
          }),
        ])),
      ),
      asignarAsignatura: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignacion('Asignatura asociada correctamente.'),
        ),
      ),
      actualizarRelacion: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignacion('Relación actualizada correctamente.'),
        ),
      ),
      quitarAsignatura: vi.fn(() =>
        respuestaObservable(
          crearRespuestaAsignacion('Asignatura quitada correctamente.'),
        ),
      ),
      construirIdAsignacion: vi.fn((carreraId, asignaturaId) =>
        `${carreraId}-${asignaturaId}`,
      ),
    };
    carrerasServicio = {
      listarCarreras: vi.fn(() =>
        respuestaObservable(crearRespuestaCarreras([
          crearCarrera(),
          crearCarrera({
            id: 8,
            codigo: 'MED',
            nombre: 'Medicina',
            activo: false,
          }),
        ])),
      ),
    };
    asignaturasServicio = {
      listarAsignaturas: vi.fn(() =>
        respuestaObservable(crearRespuestaAsignaturas([
          crearAsignatura(),
          crearAsignatura({
            id: 4,
            codigo: 'PRO2',
            nombre: 'Programación II',
            nivel_academico: 2,
          }),
          crearAsignatura({
            id: 9,
            codigo: 'BAS',
            nombre: 'Bases de datos',
            nivel_academico: 3,
            activo: false,
          }),
        ])),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [GestionMallaComponent],
      providers: [
        provideRouter([]),
        { provide: MallaCurricularService, useValue: servicioMalla },
        { provide: CarrerasService, useValue: carrerasServicio },
        { provide: AsignaturasService, useValue: asignaturasServicio },
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
      ],
    }).compileComponents();
  });

  it('carga catálogos reales de carreras y asignaturas al iniciar', () => {
    crearComponente();

    expect(carrerasServicio.listarCarreras).toHaveBeenCalledTimes(1);
    expect(carrerasServicio.listarCarreras).toHaveBeenCalledWith({
      activo: true,
      limite: 100,
    });
    expect(asignaturasServicio.listarAsignaturas).toHaveBeenCalledTimes(1);
    expect(asignaturasServicio.listarAsignaturas).toHaveBeenCalledWith({
      activo: true,
      limite: 100,
    });
    expect(componente.carreras()).toHaveLength(1);
    expect(componente.carreras()[0]?.nombre).toBe('Software');
    expect(componente.catalogos()).toHaveLength(2);
  });

  it('ignora un identificador de carrera inválido sin consultar', () => {
    crearComponente();

    componente.formularioAsignar.controls.carreraId.setValue('abc');
    componente.consultarMalla();

    expect(servicioMalla.consultarAsignaturasCarrera).not.toHaveBeenCalled();
    expect(componente.carreraMalla()).toBeNull();
  });

  it('consulta la malla real al seleccionar una carrera', () => {
    crearComponente();

    seleccionarCarreraYConsultar(7);

    expect(servicioMalla.consultarAsignaturasCarrera).toHaveBeenCalledWith(
      7,
      1,
      100,
    );
    expect(componente.carreraMalla()?.nombre).toBe('Software');
  });

  it('muestra carga mientras consulta la malla', () => {
    const pendiente = new Subject<RespuestaAsignaturasCarrera>();
    servicioMalla.consultarAsignaturasCarrera.mockReturnValueOnce(
      pendiente.asObservable(),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerTexto()).toContain('Consultando malla curricular...');
    pendiente.next(crearRespuestaAsignaturasCarrera([crearAsignatura()]));
    pendiente.complete();
    fixture.detectChanges();
  });

  it('renderiza código, nombre, créditos y nivel académico de las asignaturas', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerTexto()).toContain('PRO1');
    expect(obtenerTexto()).toContain('Programación I');
    expect(obtenerTexto()).toContain('4');
    expect(obtenerTexto()).toContain('1');
    expect(obtenerTexto()).toContain('Programación II');
  });

  it('muestra estado vacío cuando la carrera no tiene asignaturas', () => {
    servicioMalla.consultarAsignaturasCarrera.mockReturnValueOnce(
      respuestaObservable(crearRespuestaAsignaturasCarrera([], { total: 0 })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerTexto()).toContain(
      'La carrera no tiene asignaturas asignadas.',
    );
  });

  it('muestra error de red al consultar la malla', () => {
    servicioMalla.consultarAsignaturasCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('muestra error de carrera inexistente (404) al consultar', () => {
    servicioMalla.consultarAsignaturasCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 404 })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(999999);

    expect(obtenerTexto()).toContain('La carrera solicitada no existe.');
  });

  it('excluye del catálogo las asignaturas ya asociadas a la carrera', () => {
    servicioMalla.consultarAsignaturasCarrera.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaAsignaturasCarrera([crearAsignatura()]),
      ),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);

    const opciones = obtenerOpcionesSelect('#asignatura');

    expect(opciones).toContain('PRO2 - Programación II');
    expect(opciones).not.toContain('PRO1 - Programación I');
  });

  it('ADMIN ve acciones de gestión', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerBoton('Agregar asignatura')).toBeTruthy();
    expect(obtenerBoton('Editar')).toBeTruthy();
    expect(obtenerBoton('Quitar')).toBeTruthy();
  });

  it('roles no administradores no ven acciones de gestión', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));

    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerBoton('Agregar asignatura')).toBeNull();
    expect(obtenerBoton('Editar')).toBeNull();
    expect(obtenerBoton('Quitar')).toBeNull();
  });

  it('rechaza el formulario de asignación inválido sin llamar a la API', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);

    componente.asignar();
    fixture.detectChanges();

    expect(servicioMalla.asignarAsignatura).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'Seleccione la carrera y la asignatura a asociar.',
    );
  });

  it('agregar asignatura envía el payload exacto y recarga la malla', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);
    servicioMalla.consultarAsignaturasCarrera.mockClear();

    componente.formularioAsignar.controls.asignaturaId.setValue('4');
    componente.asignar();
    fixture.detectChanges();

    expect(servicioMalla.asignarAsignatura).toHaveBeenCalledWith({
      carrera_id: 7,
      asignatura_id: 4,
    });
    expect(obtenerTexto()).toContain('Asignatura asociada correctamente.');
    expect(componente.formularioAsignar.controls.asignaturaId.value).toBe('');
    expect(servicioMalla.consultarAsignaturasCarrera).toHaveBeenCalledWith(
      7,
      1,
      100,
    );
  });

  it('evita doble envío al agregar asignatura', () => {
    const pendiente = new Subject<RespuestaAsignacion>();
    servicioMalla.asignarAsignatura.mockReturnValueOnce(
      pendiente.asObservable(),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);
    componente.formularioAsignar.controls.asignaturaId.setValue('4');

    componente.asignar();
    componente.asignar();

    expect(servicioMalla.asignarAsignatura).toHaveBeenCalledTimes(1);
    pendiente.complete();
  });

  it('mantiene los valores y muestra el error si la asignación es duplicada', () => {
    servicioMalla.asignarAsignatura.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'ASIGNACION_CURRICULAR_DUPLICATED',
          message: 'La asignatura ya esta asociada a la carrera.',
        },
      })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);
    componente.formularioAsignar.controls.asignaturaId.setValue('4');

    componente.asignar();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'La asignatura ya está asociada a la carrera.',
    );
    expect(componente.formularioAsignar.controls.asignaturaId.value).toBe('4');
  });

  it('muestra error de asignatura inactiva al agregar', () => {
    servicioMalla.asignarAsignatura.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'ASIGNATURA_INACTIVA',
          message: 'La asignatura no esta activa.',
        },
      })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);
    componente.formularioAsignar.controls.asignaturaId.setValue('4');

    componente.asignar();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('La asignatura no está activa.');
  });

  it('bloquea la asignación para roles no administradores', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.GESTOR_MATRICULA));

    crearComponente();
    seleccionarCarreraYConsultar(7);
    componente.formularioAsignar.controls.asignaturaId.setValue('4');

    componente.asignar();

    expect(servicioMalla.asignarAsignatura).not.toHaveBeenCalled();
  });

  it('inicia la edición poblando los datos actuales de la relación', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);

    componente.iniciarEdicion(crearAsignatura());

    expect(componente.relacionEnEdicion()).toEqual({
      carreraId: 7,
      asignaturaId: 3,
    });
    expect(componente.formularioEditar.controls.asignaturaId.value).toBe('3');
  });

  it('guarda la edición enviando solo el campo de la relación modificado', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);
    servicioMalla.consultarAsignaturasCarrera.mockClear();

    componente.iniciarEdicion(crearAsignatura());
    componente.formularioEditar.controls.asignaturaId.setValue('4');
    componente.guardarEdicion();
    fixture.detectChanges();

    expect(servicioMalla.actualizarRelacion).toHaveBeenCalledWith('7-3', {
      asignatura_id: 4,
    });
    expect(obtenerTexto()).toContain('Relación actualizada correctamente.');
    expect(componente.relacionEnEdicion()).toBeNull();
    expect(servicioMalla.consultarAsignaturasCarrera).toHaveBeenCalledWith(
      7,
      1,
      100,
    );
  });

  it('cancela la edición sin reemplazar la asignatura por sí misma', () => {
    crearComponente();
    seleccionarCarreraYConsultar(7);

    componente.iniciarEdicion(crearAsignatura());
    componente.guardarEdicion();

    expect(servicioMalla.actualizarRelacion).not.toHaveBeenCalled();
    expect(componente.relacionEnEdicion()).toBeNull();
  });

  it('evita doble envío al guardar la edición', () => {
    const pendiente = new Subject<RespuestaAsignacion>();
    servicioMalla.actualizarRelacion.mockReturnValueOnce(
      pendiente.asObservable(),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);
    componente.iniciarEdicion(crearAsignatura());
    componente.formularioEditar.controls.asignaturaId.setValue('4');

    componente.guardarEdicion();
    componente.guardarEdicion();

    expect(servicioMalla.actualizarRelacion).toHaveBeenCalledTimes(1);
    pendiente.complete();
  });

  it('muestra error si la edición encuentra un conflicto', () => {
    servicioMalla.actualizarRelacion.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'ASIGNACION_CURRICULAR_DUPLICATED',
          message: 'La asignatura ya esta asociada a la carrera.',
        },
      })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);
    componente.iniciarEdicion(crearAsignatura());
    componente.formularioEditar.controls.asignaturaId.setValue('4');

    componente.guardarEdicion();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'La asignatura ya está asociada a la carrera.',
    );
    expect(componente.relacionEnEdicion()).not.toBeNull();
  });

  it('confirma antes de quitar la relación y explica que no borra el catálogo', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    seleccionarCarreraYConsultar(7);
    servicioMalla.consultarAsignaturasCarrera.mockClear();

    componente.quitarAsignatura(crearAsignatura());
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    const mensaje = String(confirmar.mock.calls[0]?.[0]);
    expect(mensaje).toContain('Programación I');
    expect(mensaje).toContain('no borra la asignatura del catálogo');
    expect(servicioMalla.quitarAsignatura).toHaveBeenCalledWith('7-3');
    expect(obtenerTexto()).toContain('Asignatura quitada correctamente.');
    expect(servicioMalla.consultarAsignaturasCarrera).toHaveBeenCalledWith(
      7,
      1,
      100,
    );
  });

  it('no quita la relación si se cancela la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    crearComponente();
    seleccionarCarreraYConsultar(7);

    componente.quitarAsignatura(crearAsignatura());

    expect(servicioMalla.quitarAsignatura).not.toHaveBeenCalled();
  });

  it('evita doble solicitud al quitar la relación', () => {
    const pendiente = new Subject<RespuestaAsignacion>();
    servicioMalla.quitarAsignatura.mockReturnValueOnce(
      pendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    seleccionarCarreraYConsultar(7);

    componente.quitarAsignatura(crearAsignatura());
    componente.quitarAsignatura(
      crearAsignatura({ id: 4, codigo: 'PRO2', nombre: 'Programación II' }),
    );

    expect(servicioMalla.quitarAsignatura).toHaveBeenCalledTimes(1);
    pendiente.complete();
  });

  it('muestra error sin retirar visualmente la relación si falla', () => {
    servicioMalla.quitarAsignatura.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 404,
        error: {
          success: false,
          message: 'Asignacion curricular no encontrada.',
        },
      })),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    crearComponente();
    seleccionarCarreraYConsultar(7);
    servicioMalla.consultarAsignaturasCarrera.mockClear();

    componente.quitarAsignatura(crearAsignatura());
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'La relación o el registro solicitado no existe.',
    );
    expect(servicioMalla.consultarAsignaturasCarrera).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain('Programación I');
  });

  it('bloquea el quitado para roles no administradores', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    crearComponente();
    seleccionarCarreraYConsultar(7);

    componente.quitarAsignatura(crearAsignatura());

    expect(servicioMalla.quitarAsignatura).not.toHaveBeenCalled();
  });

  it('muestra error de permisos (403) cuando el backend lo rechaza', () => {
    servicioMalla.consultarAsignaturasCarrera.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 403 })),
    );

    crearComponente();
    seleccionarCarreraYConsultar(7);

    expect(obtenerTexto()).toContain(
      'No tiene permisos para gestionar la malla curricular.',
    );
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(GestionMallaComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function seleccionarCarreraYConsultar(idCarrera: number): void {
    componente.formularioAsignar.controls.carreraId.setValue(String(idCarrera));
    componente.consultarMalla();
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
  }

  function obtenerOpcionesSelect(selector: string): string[] {
    const select = fixture.nativeElement.querySelector(
      selector,
    ) as HTMLSelectElement | null;

    if (!select) {
      return [];
    }

    return Array.from(select.options)
      .map((opcion) => opcion.textContent?.trim() ?? '')
      .filter(Boolean);
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
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

function crearCarrera(cambios: Partial<Carrera> = {}): Carrera {
  return {
    id: 7,
    codigo: 'SOF',
    nombre: 'Software',
    duracion_semestres: 8,
    facultad_id: 2,
    activo: true,
    ...cambios,
  };
}

function crearAsignatura(cambios: Partial<Asignatura> = {}): Asignatura {
  return {
    id: 3,
    codigo: 'PRO1',
    nombre: 'Programación I',
    creditos: 4,
    nivel_academico: 1,
    activo: true,
    ...cambios,
  };
}

function crearRespuestaCarreras(carreras: Carrera[]): RespuestaListadoCarreras {
  return {
    success: true,
    data: carreras,
    page: 1,
    limit: 100,
    total: carreras.length,
    totalPages: 1,
  };
}

function crearRespuestaAsignaturas(
  asignaturas: Asignatura[],
): RespuestaListadoAsignaturas {
  return {
    success: true,
    data: asignaturas,
    page: 1,
    limit: 100,
    total: asignaturas.length,
    totalPages: 1,
  };
}

function crearRespuestaAsignaturasCarrera(
  asignaturas: Asignatura[],
  paginacion: Partial<RespuestaAsignaturasCarrera> = {},
): RespuestaAsignaturasCarrera {
  return {
    success: true,
    carrera: crearCarrera(),
    data: asignaturas,
    page: 1,
    limit: 100,
    total: asignaturas.length,
    totalPages: 1,
    ...paginacion,
  };
}

function crearRespuestaAsignacion(mensaje: string): RespuestaAsignacion {
  return {
    success: true,
    message: mensaje,
    data: {
      id: '7-3',
      carrera_id: 7,
      asignatura_id: 3,
      carrera: crearCarrera(),
      asignatura: crearAsignatura(),
    },
  };
}
