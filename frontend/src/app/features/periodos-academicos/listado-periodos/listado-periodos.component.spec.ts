import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type { UsuarioAutenticado } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  EstadoPeriodoAcademico,
  FiltrosListadoPeriodos,
  PeriodoAcademico,
  RespuestaListadoPeriodos,
} from '../models/periodo-academico.model';
import { TRANSICIONES_PERIODO_ACADEMICO } from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';
import { ListadoPeriodosComponent } from './listado-periodos.component';

interface PeriodosAcademicosServiceMock {
  listarPeriodos: ReturnType<
    typeof vi.fn<
      (filtros?: FiltrosListadoPeriodos) => Observable<RespuestaListadoPeriodos>
    >
  >;
}

interface AutenticacionServiceMock {
  usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
}

describe('ListadoPeriodosComponent', () => {
  let fixture: ComponentFixture<ListadoPeriodosComponent>;
  let componente: ListadoPeriodosComponent;
  let periodosAcademicosService: PeriodosAcademicosServiceMock;
  let autenticacionService: AutenticacionServiceMock;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let solicitudesPeriodos: Subject<RespuestaListadoPeriodos>[];

  beforeEach(async () => {
    solicitudesPeriodos = [];
    periodosAcademicosService = {
      listarPeriodos: vi.fn(() => {
        const solicitud = new Subject<RespuestaListadoPeriodos>();
        solicitudesPeriodos.push(solicitud);
        return solicitud.asObservable();
      }),
    };
    usuarioActual = signal<UsuarioAutenticado | null>(null);
    autenticacionService = {
      usuarioActual,
    };

    await TestBed.configureTestingModule({
      imports: [ListadoPeriodosComponent],
      providers: [
        provideRouter([]),
        {
          provide: PeriodosAcademicosService,
          useValue: periodosAcademicosService,
        },
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoPeriodosComponent);
    componente = fixture.componentInstance;
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('consulta periodos al iniciar', () => {
    iniciarComponente();

    expect(periodosAcademicosService.listarPeriodos).toHaveBeenCalledTimes(1);
  });

  it('usa pagina 1 al iniciar', () => {
    iniciarComponente();

    expect(obtenerUltimosFiltros()?.pagina).toBe(1);
  });

  it('usa limite 10 al iniciar', () => {
    iniciarComponente();

    expect(obtenerUltimosFiltros()?.limite).toBe(10);
  });

  it('el formulario inicia vacio', () => {
    expect(componente.formularioFiltros.getRawValue()).toEqual({
      codigo: '',
      nombre: '',
      estado: '',
      anio: '',
      fechaInicio: '',
      fechaFin: '',
    });
  });

  it('envia codigo', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ codigo: '2026-1' });

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.codigo).toBe('2026-1');
  });

  it('envia nombre', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ nombre: 'Primer periodo' });

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.nombre).toBe('Primer periodo');
  });

  it('envia estado', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ estado: 'en_curso' });

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.estado).toBe('en_curso');
  });

  it('convierte anio a numero', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ anio: '2026' });

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.anio).toBe(2026);
  });

  it('envia fecha inicial', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ fechaInicio: '2026-01-05' });

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.fechaInicio).toBe('2026-01-05');
  });

  it('envia fecha final', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ fechaFin: '2026-06-30' });

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.fechaFin).toBe('2026-06-30');
  });

  it('omite valores vacios', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({
      codigo: '   ',
      nombre: '',
      estado: '',
      anio: '',
      fechaInicio: '',
      fechaFin: '',
    });

    componente.buscarPeriodos();

    expect(periodosAcademicosService.listarPeriodos).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('buscar reinicia pagina', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 2, totalPages: 3 }));
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.buscarPeriodos();

    expect(obtenerUltimosFiltros()?.pagina).toBe(1);
  });

  it('codigo maximo 20', () => {
    componente.formularioFiltros.patchValue({ codigo: 'a'.repeat(21) });

    expect(componente.formularioFiltros.controls.codigo.invalid).toBe(true);
  });

  it('nombre maximo 100', () => {
    componente.formularioFiltros.patchValue({ nombre: 'a'.repeat(101) });

    expect(componente.formularioFiltros.controls.nombre.invalid).toBe(true);
  });

  it('anio minimo 1900', () => {
    componente.formularioFiltros.patchValue({ anio: '1899' });

    expect(componente.formularioFiltros.controls.anio.hasError('min')).toBe(true);
  });

  it('anio maximo 2200', () => {
    componente.formularioFiltros.patchValue({ anio: '2201' });

    expect(componente.formularioFiltros.controls.anio.hasError('max')).toBe(true);
  });

  it('rechaza decimales', () => {
    componente.formularioFiltros.patchValue({ anio: '2026.5' });

    expect(componente.formularioFiltros.controls.anio.hasError('anioDecimal'))
      .toBe(true);
  });

  it('rechaza rango de fechas invertido', () => {
    componente.formularioFiltros.patchValue({
      fechaInicio: '2026-06-30',
      fechaFin: '2026-01-05',
    });

    expect(componente.formularioFiltros.hasError('rangoFechasInvalido'))
      .toBe(true);
  });

  it('formulario invalido no consulta', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();
    componente.formularioFiltros.patchValue({ codigo: 'a'.repeat(21) });

    componente.buscarPeriodos();

    expect(periodosAcademicosService.listarPeriodos).not.toHaveBeenCalled();
  });

  it('limpiar filtros vuelve a consultar', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.limpiarFiltros();

    expect(periodosAcademicosService.listarPeriodos).toHaveBeenCalledTimes(1);
  });

  it('limpiar conserva limite', () => {
    iniciarYCompletar();
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.limpiarFiltros();

    expect(obtenerUltimosFiltros()?.limite).toBe(10);
  });

  it('guarda la lista', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ id: 2 })],
    }));

    expect(componente.periodos()[0]?.id).toBe(2);
  });

  it('guarda paginacion', () => {
    iniciarYCompletar(crearRespuestaListado({
      page: 2,
      limit: 10,
      total: 11,
      totalPages: 2,
    }));

    expect(componente.paginaActual()).toBe(2);
    expect(componente.limitePorPagina()).toBe(10);
    expect(componente.totalPeriodos()).toBe(11);
    expect(componente.totalPaginas()).toBe(2);
  });

  it('conserva orden recibido', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearPeriodo({ id: 3, codigo: '2026-2' }),
        crearPeriodo({ id: 1, codigo: '2026-1' }),
      ],
    }));

    expect(componente.periodos().map((periodo) => periodo.id)).toEqual([3, 1]);
  });

  it('muestra todos los estados', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearPeriodo({ id: 1, estado: 'planificado' }),
        crearPeriodo({ id: 2, estado: 'matricula_abierta' }),
        crearPeriodo({ id: 3, estado: 'en_curso' }),
        crearPeriodo({ id: 4, estado: 'cerrado' }),
      ],
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Planificado');
    expect(obtenerTexto()).toContain('Matrícula abierta');
    expect(obtenerTexto()).toContain('En curso');
    expect(obtenerTexto()).toContain('Cerrado');
  });

  it('aplica clase de badge segun el estado', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearPeriodo({ id: 1, estado: 'matricula_abierta' }),
        crearPeriodo({ id: 2, estado: 'cerrado' }),
      ],
    }));
    fixture.detectChanges();

    expect(obtenerElemento('.estado-badge--success')).toBeTruthy();
    expect(obtenerElemento('.estado-badge--neutral')).toBeTruthy();
    expect(obtenerElemento('.estado-badge--warning')).toBeNull();
  });

  it('reemplaza fechas crudas por formato humano', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    const texto = obtenerTexto();
    expect(texto).not.toContain('2026-01-05');
    expect(texto).not.toContain('2025-12-01');
  });

  it('muestra etiqueta Planificado', () => {
    expect(componente.obtenerEtiquetaEstado('planificado')).toBe('Planificado');
  });

  it('muestra etiqueta Matricula abierta', () => {
    expect(componente.obtenerEtiquetaEstado('matricula_abierta'))
      .toBe('Matrícula abierta');
  });

  it('muestra etiqueta En curso', () => {
    expect(componente.obtenerEtiquetaEstado('en_curso')).toBe('En curso');
  });

  it('muestra etiqueta Cerrado', () => {
    expect(componente.obtenerEtiquetaEstado('cerrado')).toBe('Cerrado');
  });

  it('muestra mensaje sin resultados', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [], total: 0, totalPages: 0 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('No se encontraron periodos académicos');
  });

  it('anterior deshabilitado en pagina 1', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Anterior')?.disabled).toBe(true);
  });

  it('siguiente deshabilitado en ultima pagina', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 1 }));
    fixture.detectChanges();

    expect(obtenerBoton('Siguiente')?.disabled).toBe(true);
  });

  it('siguiente incrementa y consulta', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 2 }));
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.paginaSiguiente();

    expect(obtenerUltimosFiltros()?.pagina).toBe(2);
  });

  it('anterior decrementa y consulta', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 2, totalPages: 3 }));
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.paginaAnterior();

    expect(obtenerUltimosFiltros()?.pagina).toBe(1);
  });

  it('no supera total de paginas', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 2, totalPages: 2 }));
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.paginaSiguiente();

    expect(periodosAcademicosService.listarPeriodos).not.toHaveBeenCalled();
  });

  it('no baja de pagina 1', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 2 }));
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.paginaAnterior();

    expect(periodosAcademicosService.listarPeriodos).not.toHaveBeenCalled();
  });

  it('no pagina durante carga', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 2 }));
    componente.paginaSiguiente();
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.paginaSiguiente();

    expect(periodosAcademicosService.listarPeriodos).not.toHaveBeenCalled();
  });

  it('activa carga', () => {
    iniciarComponente();

    expect(componente.cargandoPeriodos()).toBe(true);
  });

  it('desactiva carga al completar', () => {
    iniciarComponente();
    completarPeriodos();

    expect(componente.cargandoPeriodos()).toBe(false);
  });

  it('evita consultas duplicadas', () => {
    iniciarComponente();

    componente.cargarPeriodos();

    expect(periodosAcademicosService.listarPeriodos).toHaveBeenCalledTimes(1);
  });

  it.each([
    [new HttpErrorResponse({ status: 0 }), 'No fue posible conectar con el servidor.'],
    [new HttpErrorResponse({ status: 400 }), 'Revise los filtros ingresados.'],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para consultar periodos académicos.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al consultar los periodos.',
    ],
  ])('maneja errores', (error, mensaje) => {
    iniciarComponente();
    solicitudesPeriodos[0].error(error);

    expect(componente.mensajeError()).toBe(mensaje);
    expect(componente.cargandoPeriodos()).toBe(false);
  });

  it('permite reintentar', () => {
    iniciarComponente();
    solicitudesPeriodos[0].error(new HttpErrorResponse({ status: 500 }));
    periodosAcademicosService.listarPeriodos.mockClear();

    componente.buscarPeriodos();

    expect(periodosAcademicosService.listarPeriodos).toHaveBeenCalledTimes(1);
  });

  it('no elimina filtros ante error', () => {
    iniciarYCompletar();
    componente.formularioFiltros.patchValue({ codigo: '2026-1' });
    componente.buscarPeriodos();
    solicitudesPeriodos[solicitudesPeriodos.length - 1].error(
      new HttpErrorResponse({ status: 500 }),
    );

    expect(componente.formularioFiltros.controls.codigo.value).toBe('2026-1');
  });

  it('existe h1', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain('Periodos académicos');
  });

  it('existe formulario', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('form')).toBeTruthy();
  });

  it('existen seis filtros', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="codigo"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="nombre"]')).toBeTruthy();
    expect(obtenerElemento('select[formControlName="estado"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="anio"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="fechaInicio"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="fechaFin"]')).toBeTruthy();
  });

  it('existe tabla semantica', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('table')).toBeTruthy();
    expect(obtenerElemento('th[scope="col"]')).toBeTruthy();
  });

  it('existe caption', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('caption')?.textContent).toContain(
      'Listado de periodos académicos',
    );
  });

  it('sin usuario no existe columna Acciones', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Acciones');
  });

  it('ADMIN ve Nuevo periodo', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();
  });

  it('el enlace Nuevo periodo apunta a periodos academicos nuevo', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')?.getAttribute('href')).toBe(
      '/periodos-academicos/nuevo',
    );
  });

  it.each([
    'GESTOR_MATRICULA',
    'ESTUDIANTE',
    'DOCENTE',
  ])('%s no ve Nuevo periodo', (codigoRol) => {
    usuarioActual.set(crearUsuarioConRol(codigoRol));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeNull();
  });

  it('usuario sin rol no ve Nuevo periodo', () => {
    usuarioActual.set(crearUsuario({ rol: null }));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeNull();
  });

  it('sin usuario no ve Nuevo periodo', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeNull();
  });

  it('Nuevo periodo aparece si la sesion cambia a ADMIN', () => {
    iniciarYCompletar();
    expect(obtenerEnlace('Nuevo periodo')).toBeNull();

    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();
  });

  it('Nuevo periodo desaparece si la sesion cambia a otro rol', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();

    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeNull();
  });

  it('Nuevo periodo continua visible sin resultados para ADMIN', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({ data: [], total: 0, totalPages: 0 }));
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();
  });

  it('Nuevo periodo continua visible durante carga para ADMIN', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();
  });

  it('ADMIN ve columna Acciones', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Acciones');
  });

  it('ADMIN ve un enlace Editar por periodo', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearPeriodo({ id: 1 }),
        crearPeriodo({ id: 2 }),
      ],
      total: 2,
    }));
    fixture.detectChanges();

    expect(obtenerEnlaces('Editar')).toHaveLength(2);
  });

  it('el enlace Editar contiene el ID correcto', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ id: 15 })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Editar')?.getAttribute('href')).toContain('15');
  });

  it('el enlace Editar apunta a periodos academicos id editar', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ id: 15 })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/periodos-academicos/15/editar',
    );
  });

  it('varios periodos generan enlaces de edicion diferentes', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearPeriodo({ id: 15 }),
        crearPeriodo({ id: 16 }),
      ],
      total: 2,
    }));
    fixture.detectChanges();

    expect(obtenerEnlaces('Editar').map((enlace) => enlace.getAttribute('href')))
      .toEqual([
        '/periodos-academicos/15/editar',
        '/periodos-academicos/16/editar',
      ]);
  });

  it.each([
    'GESTOR_MATRICULA',
    'ESTUDIANTE',
    'DOCENTE',
  ])('%s no ve Acciones', (codigoRol) => {
    usuarioActual.set(crearUsuarioConRol(codigoRol));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Acciones');
    expect(obtenerEnlace('Editar')).toBeNull();
  });

  it('usuario sin rol no ve Acciones', () => {
    usuarioActual.set(crearUsuario({ rol: null }));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Acciones');
    expect(obtenerEnlace('Editar')).toBeNull();
  });

  it('sin usuario no ve Acciones', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Editar');
    expect(obtenerTexto()).not.toContain('Acciones');
  });

  it('la columna Acciones aparece si la sesion cambia a ADMIN', () => {
    iniciarYCompletar();
    expect(obtenerTexto()).not.toContain('Acciones');

    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Acciones');
    expect(obtenerEnlace('Editar')).toBeTruthy();
  });

  it('la columna Acciones desaparece si la sesion cambia a otro rol', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    expect(obtenerTexto()).toContain('Acciones');

    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Acciones');
    expect(obtenerEnlace('Editar')).toBeNull();
  });

  it('Nuevo periodo continua visible para ADMIN con Acciones', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();
    expect(obtenerTexto()).toContain('Acciones');
  });

  it('ADMIN ve Cambiar estado en un periodo planificado', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ id: 15, estado: 'planificado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('Cambiar estado apunta a periodos academicos id estado', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ id: 15, estado: 'planificado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')?.getAttribute('href')).toBe(
      '/periodos-academicos/15/estado',
    );
  });

  it('ADMIN ve Cambiar estado en matricula abierta', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'matricula_abierta' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('ADMIN ve Cambiar estado en curso', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'en_curso' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('no aparece Cambiar estado para periodo cerrado', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'cerrado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeNull();
  });

  it('IDs distintos generan enlaces Cambiar estado diferentes', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearPeriodo({ id: 15, estado: 'planificado' }),
        crearPeriodo({ id: 16, estado: 'en_curso' }),
      ],
      total: 2,
    }));
    fixture.detectChanges();

    expect(obtenerEnlaces('Cambiar estado').map((enlace) => enlace.getAttribute('href')))
      .toEqual([
        '/periodos-academicos/15/estado',
        '/periodos-academicos/16/estado',
      ]);
  });

  it.each([
    'GESTOR_MATRICULA',
    'ESTUDIANTE',
    'DOCENTE',
  ])('%s no ve Cambiar estado', (codigoRol) => {
    usuarioActual.set(crearUsuarioConRol(codigoRol));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'planificado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeNull();
  });

  it('usuario sin rol no ve Cambiar estado', () => {
    usuarioActual.set(crearUsuario({ rol: null }));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'planificado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeNull();
  });

  it('sin usuario no ve Cambiar estado', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'planificado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeNull();
  });

  it('Cambiar estado aparece al cambiar la sesion a ADMIN', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'planificado' })],
    }));
    expect(obtenerEnlace('Cambiar estado')).toBeNull();

    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('Cambiar estado desaparece al cambiar a otro rol', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar(crearRespuestaListado({
      data: [crearPeriodo({ estado: 'planificado' })],
    }));
    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();

    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeNull();
  });

  it('el enlace Editar continua existiendo para ADMIN', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Editar')).toBeTruthy();
  });

  it('Nuevo periodo continua existiendo para ADMIN', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo periodo')).toBeTruthy();
  });

  it('no existe boton Eliminar', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Eliminar')).toBeNull();
  });

  it('no duplica el mapa de transiciones', () => {
    (Object.keys(TRANSICIONES_PERIODO_ACADEMICO) as EstadoPeriodoAcademico[])
      .forEach((estado) => {
        expect(componente.tieneTransicionesDisponibles(estado)).toBe(
          TRANSICIONES_PERIODO_ACADEMICO[estado].length > 0,
        );
      });
  });

  it('existen botones de paginacion', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Anterior')).toBeTruthy();
    expect(obtenerBoton('Siguiente')).toBeTruthy();
  });

  it('existe estado de carga accesible', () => {
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerElemento('[role="status"]')?.textContent).toContain(
      'Consultando periodos académicos...',
    );
  });

  it('existe error con role alert', () => {
    iniciarComponente();
    solicitudesPeriodos[0].error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]')?.textContent).toContain(
      'Ocurrió un error en el servidor al consultar los periodos.',
    );
  });

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarYCompletar(respuesta = crearRespuestaListado()): void {
    iniciarComponente();
    completarPeriodos(respuesta);
    fixture.detectChanges();
  }

  function completarPeriodos(respuesta = crearRespuestaListado()): void {
    solicitudesPeriodos[solicitudesPeriodos.length - 1].next(respuesta);
    solicitudesPeriodos[solicitudesPeriodos.length - 1].complete();
  }

  function obtenerUltimosFiltros(): FiltrosListadoPeriodos | undefined {
    const llamadas = periodosAcademicosService.listarPeriodos.mock.calls;

    return llamadas[llamadas.length - 1]?.[0];
  }

  function obtenerElemento<T extends Element = Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null;
  }

  function obtenerEnlaces(texto: string): HTMLAnchorElement[] {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.filter((enlace) => enlace.textContent?.includes(texto));
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function crearPeriodo(
  parcial: Partial<PeriodoAcademico> = {},
): PeriodoAcademico {
  return {
    id: 1,
    codigo: '2026-1',
    nombre: 'Primer periodo 2026',
    fecha_inicio: '2026-01-05',
    fecha_fin: '2026-06-30',
    fecha_inicio_matricula: '2025-12-01T08:00:00.000Z',
    fecha_fin_matricula: '2025-12-20T23:59:59.000Z',
    estado: 'planificado',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...parcial,
  };
}

function crearUsuario(
  parcial: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'ACTIVO',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
    ...parcial,
  };
}

function crearUsuarioConRol(codigoRol: string): UsuarioAutenticado {
  return crearUsuario({
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  });
}

function crearRespuestaListado(
  parcial: Partial<RespuestaListadoPeriodos> = {},
): RespuestaListadoPeriodos {
  return {
    success: true,
    data: [crearPeriodo()],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    ...parcial,
  };
}
