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
  FiltrosDocentes,
  RespuestaDocente,
  RespuestaListadoDocentes,
} from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';
import { ListarDocentesComponent } from './listar-docentes.component';

interface DocentesServiceMock {
  listarDocentes: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosDocentes) => Observable<RespuestaListadoDocentes>
    >
  >;
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
        respuestaObservable(crearRespuestaDocentes([
          crearDocente({
            id: 1,
            nombres: 'Ana',
            apellidos: 'Vera',
            identificacion: '1002003004',
            especialidad: 'Matemática',
          }),
          crearDocente({
            id: 2,
            nombres: 'Luis',
            apellidos: 'Gómez',
            identificacion: '222',
            especialidad: 'Programación',
          }),
          crearDocente({
            id: 3,
            nombres: 'Pablo',
            apellidos: 'Ríos',
            identificacion: '333',
            especialidad: 'Física',
            activo: false,
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

  it('solicita la primera página con límite explícito al iniciar', () => {
    crearComponente();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(1);
    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Gómez');
  });

  it('usa total y totalPages de la respuesta del backend', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaDocentes([crearDocente()], {
          total: 25,
          totalPages: 3,
        }),
      ),
    );

    crearComponente();

    expect(componente.totalDocentes()).toBe(25);
    expect(componente.totalPaginas()).toBe(3);
  });

  it('cambia de página solicitando los datos al backend sin paginar en memoria', () => {
    const paginaUno = crearRespuestaDocentes(
      Array.from({ length: 10 }, (_, indice) =>
        crearDocente({
          id: indice + 1,
          nombres: `Persona ${indice + 1}`,
          identificacion: String(indice + 1),
        })),
      { page: 1, limit: 10, total: 11, totalPages: 2 },
    );
    const paginaDos = crearRespuestaDocentes(
      [crearDocente({ id: 11, nombres: 'Persona 11' })],
      { page: 2, limit: 10, total: 11, totalPages: 2 },
    );

    docentesService.listarDocentes
      .mockReturnValueOnce(respuestaObservable(paginaUno))
      .mockReturnValueOnce(respuestaObservable(paginaDos));

    crearComponente();
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(2);
    expect(docentesService.listarDocentes).toHaveBeenLastCalledWith({
      pagina: 2,
      limite: 10,
    });
    expect(componente.paginaActual()).toBe(2);
    expect(componente.docentes()).toHaveLength(1);
    expect(obtenerTexto()).toContain('Persona 11 Vera');
  });

  it('aplica filtros al backend y restablece a la página 1', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({
      identificacion: '1002',
      nombres: 'Ana',
      apellidos: 'Vera',
      correo: 'ana',
      especialidad: 'Matemática',
      activo: true,
    });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(1);
    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      identificacion: '1002',
      nombres: 'Ana',
      apellidos: 'Vera',
      correo: 'ana',
      especialidad: 'Matemática',
      activo: true,
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de identificación', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ identificacion: '1002003004' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      identificacion: '1002003004',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de nombres', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ nombres: 'Ana' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      nombres: 'Ana',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de apellidos', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ apellidos: 'Vera' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      apellidos: 'Vera',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de correo', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ correo: 'ana.vera' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      correo: 'ana.vera',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de especialidad', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ especialidad: 'Matemática' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      especialidad: 'Matemática',
      pagina: 1,
      limite: 10,
    });
  });

  it('envía el filtro de estado activo', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ activo: true });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      activo: true,
      pagina: 1,
      limite: 10,
    });
  });

  it('restablece a la página 1 al limpiar filtros desde el componente de filtros', () => {
    crearComponente();
    componente.filtrar({ identificacion: '222' });
    docentesService.listarDocentes.mockClear();

    componente.filtrar({});
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(1);
    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
    expect(obtenerTexto()).toContain('Ana Vera');
    expect(obtenerTexto()).toContain('Luis Gómez');
  });

  it('no filtra ni pagina localmente los registros devueltos por el backend', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaDocentes(
          Array.from({ length: 11 }, (_, indice) =>
            crearDocente({
              id: indice + 1,
              nombres: `Persona ${indice + 1}`,
              identificacion: String(indice + 1),
            })),
          { page: 1, limit: 10, total: 11, totalPages: 2 },
        ),
      ),
    );

    crearComponente();

    expect(componente.docentes()).toHaveLength(11);
    expect(componente.totalDocentes()).toBe(11);
    expect(componente.totalPaginas()).toBe(2);
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      respuestaObservable(crearRespuestaDocentes([])),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('No se encontraron docentes');
  });

  it('muestra error de API al cargar docentes', () => {
    docentesService.listarDocentes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('limpia los resultados anteriores si falla una carga posterior', () => {
    crearComponente();

    docentesService.listarDocentes.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );
    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.docentes()).toEqual([]);
    expect(obtenerTexto()).not.toContain('Ana Vera');
  });

  it('ADMIN ve acciones administrativas', () => {
    crearComponente();

    expect(obtenerEnlace('Nuevo docente')).toBeTruthy();
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

  it('confirma antes de inactivar y recarga la página actual', () => {
    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);
    fixture.detectChanges();

    expect(obtenerBoton('Confirmar')).toBeTruthy();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(docentesService.cambiarEstadoDocente).toHaveBeenCalledWith(1, false);
    expect(obtenerTexto()).toContain('Operación completada.');
    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(2);
    expect(docentesService.listarDocentes).toHaveBeenLastCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('activa docentes inactivos con confirmacion', () => {
    docentesService.cambiarEstadoDocente.mockReturnValueOnce(
      respuestaObservable(crearRespuestaDocente({ activo: true })),
    );

    crearComponente();
    componente.cambiarEstadoDocente(crearDocente({ id: 3, activo: false }));
    fixture.detectChanges();

    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(docentesService.cambiarEstadoDocente).toHaveBeenCalledWith(3, true);
  });

  it('no cambia estado si el usuario cancela la confirmacion', () => {
    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);
    fixture.detectChanges();

    obtenerBoton('Cancelar')?.click();
    fixture.detectChanges();

    expect(docentesService.cambiarEstadoDocente).not.toHaveBeenCalled();
  });

  it('evita solicitudes duplicadas mientras procesa estado', () => {
    const solicitudPendiente = new Subject<RespuestaDocente>();

    docentesService.cambiarEstadoDocente.mockReturnValueOnce(
      solicitudPendiente.asObservable(),
    );

    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();
    obtenerBoton('Confirmar')?.click();

    expect(docentesService.cambiarEstadoDocente).toHaveBeenCalledTimes(1);
  });

  it('ignora resultados obsoletos de una consulta anterior', () => {
    const consultaAnterior = new Subject<RespuestaListadoDocentes>();
    const consultaNueva = new Subject<RespuestaListadoDocentes>();

    crearComponente();
    docentesService.listarDocentes
      .mockReturnValueOnce(consultaAnterior.asObservable())
      .mockReturnValueOnce(consultaNueva.asObservable());

    componente.filtrar({ nombres: 'Ana' });
    componente.filtrar({ especialidad: 'Matemática' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(3);

    consultaNueva.next(
      crearRespuestaDocentes([crearDocente({ nombres: 'Nuevo' })]),
    );
    consultaNueva.complete();
    consultaAnterior.next(
      crearRespuestaDocentes([crearDocente({ nombres: 'Obsoleto' })]),
    );
    consultaAnterior.complete();
    fixture.detectChanges();

    expect(componente.docentes()).toHaveLength(1);
    expect(componente.docentes()[0].nombres).toBe('Nuevo');
  });

  it('muestra error al cambiar estado', () => {
    docentesService.cambiarEstadoDocente.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 403 })),
    );

    crearComponente();
    componente.cambiarEstadoDocente(componente.docentes()[0]);
    fixture.detectChanges();

    obtenerBoton('Confirmar')?.click();
    fixture.detectChanges();

    expect(componente.mensajeError()).toBe(
      'No tiene permisos para gestionar docentes.',
    );
  });

  it('informa cuantos filtros están activos', () => {
    crearComponente();

    expect(componente.filtrosActivos()).toBe(0);
    expect(obtenerTexto()).toContain('Filtros activos: 0');

    componente.filtrar({ identificacion: '1002', activo: true });
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(2);
    expect(obtenerTexto()).toContain('Filtros activos: 2');
  });

  it('no renderiza el botón Buscar en la lista', () => {
    crearComponente();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  it('limpiar filtros estando sin filtros no dispara una consulta', () => {
    crearComponente();
    docentesService.listarDocentes.mockClear();

    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(docentesService.listarDocentes).not.toHaveBeenCalled();
  });

  it('limpiar filtros restablece a la página 1', () => {
    crearComponente();
    componente.cambiarPagina(2);
    docentesService.listarDocentes.mockClear();

    componente.filtrar({ nombres: 'Ana' });
    fixture.detectChanges();

    expect(docentesService.listarDocentes).toHaveBeenCalledTimes(1);
    expect(docentesService.listarDocentes).toHaveBeenCalledWith({
      nombres: 'Ana',
      pagina: 1,
      limite: 10,
    });
  });

  it('selecciona y deselecciona una fila con clic', () => {
    crearComponente();
    const primera = componente.docentes()[0];

    clicEnFila(primera);
    expect(componente.filaSeleccionada()?.id).toBe(primera.id);

    clicEnFila(primera);
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('selecciona la fila con Enter o Espacio', () => {
    crearComponente();
    const primera = componente.docentes()[0];

    teclaEnFila(primera, 'Enter');
    expect(componente.filaSeleccionada()?.id).toBe(primera.id);

    teclaEnFila(primera, ' ');
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('no selecciona al pulsar un enlace o botón interno', () => {
    crearComponente();
    const boton = obtenerBoton('Editar');

    boton?.click();

    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('el checkbox interno alterna la selección una sola vez', () => {
    crearComponente();
    const primera = componente.docentes()[0];

    obtenerCheckboxSeleccion(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(componente.filaSeleccionada()?.id).toBe(primera.id);

    obtenerCheckboxSeleccion(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('muestra la barra contextual con las acciones válidas al seleccionar', () => {
    crearComponente();
    const primera = componente.docentes()[0];

    clicEnFila(primera);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('1 registro seleccionado');
    expect(obtenerBoton('Editar')).toBeTruthy();
    expect(obtenerBoton('Inactivar')).toBeTruthy();
  });

  it('muestra Activar cuando el docente seleccionado está inactivo', () => {
    crearComponente();
    clicEnFila(componente.docentes()[2]);

    expect(componente.accionesContextuales()).toEqual([
      { id: 'editar', etiqueta: 'Editar' },
      { id: 'cambiar-estado', etiqueta: 'Activar', variante: 'neutral' },
    ]);
  });

  it('usa variante danger para inactivar y neutral para activar', () => {
    crearComponente();
    clicEnFila(componente.docentes()[0]);

    expect(componente.accionesContextuales()).toEqual([
      { id: 'editar', etiqueta: 'Editar' },
      {
        id: 'cambiar-estado',
        etiqueta: 'Inactivar',
        variante: 'danger',
      },
    ]);
  });

  it('marca visualmente la fila seleccionada', () => {
    crearComponente();
    const primera = componente.docentes()[0];

    clicEnFila(primera);
    fixture.detectChanges();

    expect(obtenerFila(primera).classList.contains('fila-seleccionada')).toBe(
      true,
    );
  });

  it('limpia la selección al paginar', () => {
    crearComponente();
    const primera = componente.docentes()[0];
    clicEnFila(primera);

    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('roles no administradores no reciben acciones contextuales', () => {
    usuarioActual.set(crearUsuario(CODIGOS_ROL.DOCENTE));
    crearComponente();
    const primera = componente.docentes()[0];

    clicEnFila(primera);
    fixture.detectChanges();

    expect(componente.accionesContextuales()).toEqual([]);
    expect(obtenerBoton('Editar')).toBeNull();
    expect(obtenerBoton('Inactivar')).toBeNull();
  });

  it('ejecuta editar desde la barra contextual', () => {
    crearComponente();
    const primera = componente.docentes()[0];
    clicEnFila(primera);
    fixture.detectChanges();

    obtenerBoton('Editar')?.click();
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith(['/docentes/editar', 1]);
  });

  it('ejecuta cambiar estado desde la barra contextual', () => {
    crearComponente();
    const primera = componente.docentes()[0];
    clicEnFila(primera);
    fixture.detectChanges();

    obtenerBoton('Inactivar')?.click();
    fixture.detectChanges();

    expect(obtenerBoton('Confirmar')).toBeTruthy();
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

  function clicEnFila(docente: Docente): void {
    const celda = obtenerFila(docente).querySelector('td:not(.columna-seleccion)');

    celda?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function teclaEnFila(docente: Docente, tecla: string): void {
    obtenerFila(docente).dispatchEvent(
      new KeyboardEvent('keydown', { key: tecla, bubbles: true }),
    );
  }

  function obtenerFila(docente: Docente): HTMLTableRowElement {
    const filas = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr'),
    ) as HTMLTableRowElement[];

    const fila = filas.find(
      (filaEncontrada) =>
        filaEncontrada.textContent?.includes(docente.identificacion),
    );

    if (!fila) {
      throw new Error('No se encontró la fila del docente');
    }

    return fila;
  }

  function obtenerCheckboxSeleccion(indice: number): HTMLInputElement | null {
    const checkboxes = Array.from(
      fixture.nativeElement.querySelectorAll(
        'tbody tr .columna-seleccion input[type="checkbox"]',
      ),
    ) as HTMLInputElement[];

    return checkboxes[indice] ?? null;
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

function crearRespuestaDocentes(
  docentes: Docente[],
  paginacion: Partial<RespuestaListadoDocentes> = {},
): RespuestaListadoDocentes {
  return {
    success: true,
    data: docentes,
    page: 1,
    limit: 10,
    total: docentes.length,
    totalPages: Math.ceil(docentes.length / 10),
    ...paginacion,
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
