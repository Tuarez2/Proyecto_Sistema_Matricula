import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { CODIGOS_ROL } from '../../../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import {
  ESTADOS_MATRICULA,
  type EstadoMatricula,
  type FiltrosMatriculas,
  type Matricula,
  type RespuestaCambioEstadoMatricula,
  type RespuestaListadoMatriculas,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';
import { ListarMatriculasComponent } from './listar-matriculas.component';

interface MatriculasServiceMock {
  listarMatriculas: ReturnType<
    typeof vi.fn<(filtros?: FiltrosMatriculas) => Observable<RespuestaListadoMatriculas>>
  >;
  cambiarEstadoMatricula: ReturnType<
    typeof vi.fn<
      (
        idMatricula: number,
        solicitud: { estado: EstadoMatricula },
      ) => Observable<RespuestaCambioEstadoMatricula>
    >
  >;
}

describe('ListarMatriculasComponent', () => {
  let fixture: ComponentFixture<ListarMatriculasComponent>;
  let componente: ListarMatriculasComponent;
  let matriculasService: MatriculasServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let solicitudesMatriculas: Subject<RespuestaListadoMatriculas>[];

  beforeEach(async () => {
    solicitudesMatriculas = [];
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario(CODIGOS_ROL.ADMIN),
    );
    matriculasService = {
      listarMatriculas: vi.fn(() => {
        const solicitud = new Subject<RespuestaListadoMatriculas>();
        solicitudesMatriculas.push(solicitud);
        return solicitud.asObservable();
      }),
      cambiarEstadoMatricula: vi.fn(() =>
        respuestaObservable(crearRespuestaCambioEstado({
          estado: ESTADOS_MATRICULA.retirada,
        })),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ListarMatriculasComponent],
      providers: [
        provideRouter([]),
        {
          provide: MatriculasService,
          useValue: matriculasService,
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

  it('crea el componente', () => {
    crearComponente();

    expect(componente).toBeTruthy();
  });

  it('consulta matrículas al iniciar', () => {
    crearComponente();

    expect(matriculasService.listarMatriculas).toHaveBeenCalledTimes(1);
  });

  it('usa pagina 1 al iniciar', () => {
    iniciarYCompletar();

    expect(obtenerUltimosFiltros()?.page).toBe(1);
  });

  it('usa limite 10 al iniciar', () => {
    iniciarYCompletar();

    expect(obtenerUltimosFiltros()?.limit).toBe(10);
  });

  it('el formulario inicia vacio', () => {
    crearComponente();

    expect(componente.formularioFiltros.getRawValue()).toEqual({
      estudiante_id: '',
      curso_id: '',
      periodo_id: '',
      asignatura_id: '',
      carrera_id: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
  });

  it('carga matrículas al iniciar', () => {
    iniciarYCompletar(crearRespuestaListado([
      crearMatricula({ id: 1 }),
      crearMatricula({
        id: 2,
        estudiante: {
          ...crearMatricula().estudiante!,
          nombres: 'Luis',
          identificacion: '222',
        },
      }),
    ]));

    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Vera');
    expect(obtenerTexto()).toContain('MAT101 - Matemática I');
  });

  it('muestra estado vacío', () => {
    iniciarYCompletar(crearRespuestaListado([]));

    expect(obtenerTexto()).toContain('No se encontraron matrículas.');
  });

  it('muestra estado vacío con filtros aplicados y botón limpiar', () => {
    iniciarYCompletar(crearRespuestaListado([]));

    componente.formularioFiltros.controls.estado.setValue(
      ESTADOS_MATRICULA.aprobada,
    );
    completarMatriculas(crearRespuestaListado([]));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'No se encontraron matrículas con los filtros aplicados.',
    );
    expect(obtenerBoton('Limpiar filtros')).toBeTruthy();
  });

  it('muestra error de API', () => {
    crearComponente();
    solicitudesMatriculas[0].error(new HttpErrorResponse({ status: 0 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('No fue posible conectar con el servidor.');
  });

  it('envía filtros compatibles con el backend', () => {
    iniciarYCompletar();
    matriculasService.listarMatriculas.mockClear();

    componente.formularioFiltros.controls.estudiante_id.setValue('2');
    componente.formularioFiltros.controls.curso_id.setValue('7');
    componente.formularioFiltros.controls.periodo_id.setValue('3');
    componente.formularioFiltros.controls.asignatura_id.setValue('5');
    componente.formularioFiltros.controls.carrera_id.setValue('9');
    componente.formularioFiltros.controls.estado.setValue(
      ESTADOS_MATRICULA.inscrita,
    );
    componente.formularioFiltros.controls.fecha_desde.setValue('2026-01-01');
    componente.formularioFiltros.controls.fecha_hasta.setValue('2026-01-31');
    componente.buscarMatriculas();

    expect(matriculasService.listarMatriculas).toHaveBeenLastCalledWith({
      estudiante_id: 2,
      curso_id: 7,
      periodo_id: 3,
      asignatura_id: 5,
      carrera_id: 9,
      estado: ESTADOS_MATRICULA.inscrita,
      fecha_desde: '2026-01-01',
      fecha_hasta: '2026-01-31',
      page: 1,
      limit: 10,
    });
  });

  it('omite ids vacios y no numericos', () => {
    iniciarYCompletar();
    matriculasService.listarMatriculas.mockClear();

    componente.formularioFiltros.controls.estudiante_id.setValue('');
    componente.formularioFiltros.controls.curso_id.setValue('   ');
    componente.formularioFiltros.controls.periodo_id.setValue('');
    componente.buscarMatriculas();

    expect(obtenerUltimosFiltros()).toEqual({ page: 1, limit: 10 });
  });

  it('rechaza rango de fechas inválido antes de llamar la API', () => {
    iniciarYCompletar();
    matriculasService.listarMatriculas.mockClear();

    componente.formularioFiltros.controls.fecha_desde.setValue('2026-02-01');
    componente.formularioFiltros.controls.fecha_hasta.setValue('2026-01-01');
    componente.buscarMatriculas();
    fixture.detectChanges();

    expect(matriculasService.listarMatriculas).not.toHaveBeenCalled();
    expect(obtenerTexto()).toContain(
      'La fecha desde no puede ser posterior a la fecha hasta.',
    );
  });

  it('restablece filtros y vuelve a la primera página', () => {
    iniciarYCompletar();

    componente.formularioFiltros.controls.estado.setValue(
      ESTADOS_MATRICULA.anulada,
    );
    componente.cambiarPagina(2);
    componente.limpiarFiltros();

    expect(matriculasService.listarMatriculas).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('cambia de página con el componente compartido', () => {
    iniciarYCompletar();

    componente.cambiarPagina(2);

    expect(matriculasService.listarMatriculas).toHaveBeenLastCalledWith({
      page: 2,
      limit: 10,
    });
  });

  it('conserva los filtros al cambiar de página', () => {
    iniciarYCompletar();

    componente.formularioFiltros.controls.estado.setValue(
      ESTADOS_MATRICULA.aprobada,
    );
    completarMatriculas(crearRespuestaListado());
    fixture.detectChanges();
    matriculasService.listarMatriculas.mockClear();
    componente.cambiarPagina(2);

    expect(matriculasService.listarMatriculas).toHaveBeenLastCalledWith({
      estado: ESTADOS_MATRICULA.aprobada,
      page: 2,
      limit: 10,
    });
  });

  it('muestra acciones administrativas para ADMIN y GESTOR_MATRICULA', () => {
    iniciarYCompletar();

    expect(obtenerEnlace('Crear matrícula')).toBeTruthy();
    expect(obtenerBoton('Anular')).toBeTruthy();

    usuarioActual.set(crearUsuario(CODIGOS_ROL.GESTOR_MATRICULA));
    fixture.detectChanges();

    expect(obtenerEnlace('Crear matrícula')).toBeTruthy();
    expect(obtenerBoton('Retirar')).toBeTruthy();
  });

  it('oculta acciones administrativas para roles sin gestión', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    iniciarYCompletar();

    expect(obtenerEnlace('Crear matrícula')).toBeNull();
    expect(obtenerBoton('Anular')).toBeNull();
  });

  it('oculta la columna de identificación para roles sin gestión', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.ESTUDIANTE));

    iniciarYCompletar();

    const encabezados = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLTableCellElement>,
    ).map((encabezado) => encabezado.textContent?.trim());

    expect(encabezados).not.toContain('Identificación');
  });

  it('muestra la columna de identificación para roles de gestión', () => {
    iniciarYCompletar();

    const encabezados = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLTableCellElement>,
    ).map((encabezado) => encabezado.textContent?.trim());

    expect(encabezados).toContain('Identificación');
  });

  it('enlaza cada matrícula con su ruta de detalle', () => {
    iniciarYCompletar();

    const enlaceDetalle = obtenerEnlace('#1');

    expect(enlaceDetalle?.getAttribute('href')).toBe('/matriculas/1');
  });

  it('confirma antes de cambiar estado y actualiza la fila después de respuesta', () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);

    iniciarYCompletar();
    componente.solicitarCambioEstado(
      componente.matriculas()[0],
      ESTADOS_MATRICULA.retirada,
    );
    fixture.detectChanges();

    expect(confirmar).toHaveBeenCalled();
    expect(matriculasService.cambiarEstadoMatricula).toHaveBeenCalledWith(1, {
      estado: ESTADOS_MATRICULA.retirada,
    });
    expect(obtenerTexto()).toContain(
      'Estado de matrícula actualizado correctamente.',
    );
    expect(componente.matriculas()[0].estado).toBe(ESTADOS_MATRICULA.retirada);
  });

  it('no cambia estado si el usuario cancela la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    iniciarYCompletar();
    componente.solicitarCambioEstado(
      componente.matriculas()[0],
      ESTADOS_MATRICULA.anulada,
    );

    expect(matriculasService.cambiarEstadoMatricula).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas mientras procesa estado', () => {
    const solicitudPendiente = new Subject<RespuestaCambioEstadoMatricula>();

    matriculasService.cambiarEstadoMatricula.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    iniciarYCompletar();
    componente.solicitarCambioEstado(
      componente.matriculas()[0],
      ESTADOS_MATRICULA.retirada,
    );
    componente.solicitarCambioEstado(
      componente.matriculas()[1],
      ESTADOS_MATRICULA.anulada,
    );

    expect(matriculasService.cambiarEstadoMatricula).toHaveBeenCalledTimes(1);
  });

  it('no muestra acciones de estado para matrículas terminales', () => {
    iniciarYCompletar(crearRespuestaListado([
      crearMatricula({ estado: ESTADOS_MATRICULA.aprobada }),
    ]));

    expect(obtenerBoton('Retirar')).toBeNull();
    expect(obtenerTexto()).toContain('Sin acciones');
  });

  it('muestra error al cambiar estado', () => {
    matriculasService.cambiarEstadoMatricula.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({
        status: 409,
        error: {
          success: false,
          code: 'MATRICULA_TRANSICION_INVALIDA',
          message: 'Transición inválida.',
        },
      })),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    iniciarYCompletar();
    componente.solicitarCambioEstado(
      componente.matriculas()[0],
      ESTADOS_MATRICULA.retirada,
    );

    expect(componente.mensajeError()).toBe(
      'La transición de estado de la matrícula no está permitida.',
    );
  });

  it('ignora resultados de una consulta anterior', () => {
    crearComponente();
    const consultaAnterior = solicitudesMatriculas[0];
    const consultaNueva = new Subject<RespuestaListadoMatriculas>();
    matriculasService.listarMatriculas.mockImplementationOnce(
      () => consultaNueva.asObservable(),
    );

    componente.cargarMatriculas();

    expect(matriculasService.listarMatriculas).toHaveBeenCalledTimes(2);

    consultaNueva.next(crearRespuestaListado([crearMatricula({ id: 77 })]));
    consultaNueva.complete();
    consultaAnterior.next(crearRespuestaListado([crearMatricula({ id: 1 })]));
    consultaAnterior.complete();

    expect(componente.matriculas()[0]?.id).toBe(77);
  });

  it('al cambiar estado consulta de inmediato', () => {
    iniciarYCompletar();
    matriculasService.listarMatriculas.mockClear();

    componente.formularioFiltros.controls.estado.setValue(
      ESTADOS_MATRICULA.aprobada,
    );

    expect(matriculasService.listarMatriculas).toHaveBeenCalledTimes(1);
    expect(obtenerUltimosFiltros()).toMatchObject({
      estado: ESTADOS_MATRICULA.aprobada,
      page: 1,
      limit: 10,
    });
  });

  it('la busqueda por texto usa debounce', () => {
    vi.useFakeTimers();
    try {
      iniciarYCompletar();
      matriculasService.listarMatriculas.mockClear();

      componente.formularioFiltros.controls.curso_id.setValue('7');
      vi.advanceTimersByTime(100);
      expect(matriculasService.listarMatriculas).not.toHaveBeenCalled();

      vi.advanceTimersByTime(400);

      expect(matriculasService.listarMatriculas).toHaveBeenCalledTimes(1);
      expect(obtenerUltimosFiltros()).toMatchObject({
        curso_id: 7,
        page: 1,
        limit: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('cuenta los filtros activos', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(0);
    expect(obtenerTexto()).toContain('Filtros activos: 0');

    componente.formularioFiltros.controls.estado.setValue(
      ESTADOS_MATRICULA.anulada,
    );
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(1);
    expect(obtenerTexto()).toContain('Filtros activos: 1');
  });

  it('no existe boton Buscar', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  it('el formulario impide el envio nativo', () => {
    crearComponente();

    const evento = new Event('submit', { cancelable: true });
    componente.impedirEnvio(evento);

    expect(evento.defaultPrevented).toBe(true);
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ListarMatriculasComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function iniciarYCompletar(
    respuesta = crearRespuestaListado(),
  ): void {
    crearComponente();
    completarMatriculas(respuesta);
    fixture.detectChanges();
  }

  function completarMatriculas(
    respuesta = crearRespuestaListado(),
  ): void {
    solicitudesMatriculas[solicitudesMatriculas.length - 1].next(respuesta);
    solicitudesMatriculas[solicitudesMatriculas.length - 1].complete();
  }

  function obtenerUltimosFiltros(): FiltrosMatriculas | undefined {
    const llamadas = matriculasService.listarMatriculas.mock.calls;

    return llamadas[llamadas.length - 1]?.[0];
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
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

function crearMatricula(cambios: Partial<Matricula> = {}): Matricula {
  return {
    id: 1,
    estudiante_id: 2,
    curso_id: 7,
    fecha_matricula: '2026-01-15T10:00:00.000Z',
    estado: ESTADOS_MATRICULA.inscrita,
    calificacion_final: null,
    estudiante: {
      id: 2,
      numero_matricula: 'EST-2026-001',
      nombres: 'Ana',
      apellidos: 'Vera',
      identificacion: '1002003004',
      correo: 'ana.vera@universidad.edu',
      estado_academico: 'activo',
      nivel_academico_actual: 3,
      carrera_id: 9,
    },
    curso: {
      id: 7,
      periodo_id: 3,
      asignatura_id: 5,
      docente_id: 4,
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00-10:00',
      cupo_maximo: 30,
      estado: 'abierto',
      asignatura: {
        id: 5,
        codigo: 'MAT101',
        nombre: 'Matemática I',
        creditos: 4,
        nivel_academico: 1,
        activo: true,
      },
      docente: {
        id: 4,
        identificacion: '0912345678',
        nombres: 'Luis',
        apellidos: 'Paz',
        correo: 'luis.paz@universidad.edu',
        especialidad: 'Matemática',
        activo: true,
      },
      periodoAcademico: {
        id: 3,
        codigo: '2026-1',
        nombre: 'Periodo 2026-1',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-06-30',
        fecha_inicio_matricula: '2025-12-01',
        fecha_fin_matricula: '2026-01-31',
        estado: 'matricula_abierta',
      },
    },
    ...cambios,
  };
}

function crearRespuestaListado(
  matriculas: Matricula[] = [crearMatricula()],
): RespuestaListadoMatriculas {
  return {
    success: true,
    data: matriculas,
    page: 1,
    limit: 10,
    total: matriculas.length,
    totalPages: 1,
  };
}

function crearRespuestaCambioEstado(
  cambios: Partial<Matricula>,
): RespuestaCambioEstadoMatricula {
  return {
    success: true,
    message: 'Estado de matrícula actualizado correctamente.',
    data: crearMatricula({ id: 1, ...cambios }),
  };
}