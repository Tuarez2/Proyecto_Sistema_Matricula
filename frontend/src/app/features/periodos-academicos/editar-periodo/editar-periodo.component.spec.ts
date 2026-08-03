import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  ActualizarPeriodoAcademicoSolicitud,
  PeriodoAcademico,
  RespuestaPeriodoAcademico,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';
import { EditarPeriodoComponent } from './editar-periodo.component';

interface PeriodosAcademicosServiceMock {
  obtenerPeriodoPorId: ReturnType<
    typeof vi.fn<(idPeriodo: number) => Observable<RespuestaPeriodoAcademico>>
  >;
  actualizarPeriodo: ReturnType<
    typeof vi.fn<
      (
        idPeriodo: number,
        solicitud: ActualizarPeriodoAcademicoSolicitud,
      ) => Observable<RespuestaPeriodoAcademico>
    >
  >;
}

interface RouterMock {
  navigateByUrl: ReturnType<typeof vi.fn<(url: string) => Promise<boolean>>>;
}

interface ActivatedRouteMock {
  snapshot: {
    paramMap: {
      get: ReturnType<typeof vi.fn<(parametro: string) => string | null>>;
    };
  };
}

describe('EditarPeriodoComponent', () => {
  let fixture: ComponentFixture<EditarPeriodoComponent>;
  let componente: EditarPeriodoComponent;
  let periodosAcademicosService: PeriodosAcademicosServiceMock;
  let enrutador: RouterMock;
  let rutaActivada: ActivatedRouteMock;
  let solicitudesCarga: Subject<RespuestaPeriodoAcademico>[];
  let solicitudesActualizacion: Subject<RespuestaPeriodoAcademico>[];
  let idRuta: string | null;

  beforeEach(async () => {
    solicitudesCarga = [];
    solicitudesActualizacion = [];
    idRuta = '15';
    periodosAcademicosService = {
      obtenerPeriodoPorId: vi.fn(() => {
        const solicitud = new Subject<RespuestaPeriodoAcademico>();
        solicitudesCarga.push(solicitud);
        return solicitud.asObservable();
      }),
      actualizarPeriodo: vi.fn(() => {
        const solicitud = new Subject<RespuestaPeriodoAcademico>();
        solicitudesActualizacion.push(solicitud);
        return solicitud.asObservable();
      }),
    };
    enrutador = {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
    rutaActivada = {
      snapshot: {
        paramMap: {
          get: vi.fn(() => idRuta),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [EditarPeriodoComponent],
      providers: [
        {
          provide: PeriodosAcademicosService,
          useValue: periodosAcademicosService,
        },
        {
          provide: Router,
          useValue: enrutador,
        },
        {
          provide: ActivatedRoute,
          useValue: rutaActivada,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarPeriodoComponent);
    componente = fixture.componentInstance;
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('un ID valido consulta el periodo', () => {
    iniciarComponente();

    expect(periodosAcademicosService.obtenerPeriodoPorId)
      .toHaveBeenCalledTimes(1);
  });

  it('convierte el ID a numero', () => {
    idRuta = '25';

    iniciarComponente();

    expect(periodosAcademicosService.obtenerPeriodoPorId).toHaveBeenCalledWith(25);
  });

  it.each([
    null,
    'abc',
    '0',
    '-1',
    '1.5',
    'Infinity',
  ])('ID invalido %s no consulta', (valorId) => {
    idRuta = valorId;

    iniciarComponente();

    expect(periodosAcademicosService.obtenerPeriodoPorId).not.toHaveBeenCalled();
  });

  it('ID invalido muestra mensaje seguro', () => {
    idRuta = 'abc';

    iniciarComponente();

    expect(componente.mensajeError()).toBe(
      'El identificador del periodo académico no es válido.',
    );
  });

  it('activa cargandoPeriodo durante la carga', () => {
    iniciarComponente();

    expect(componente.cargandoPeriodo()).toBe(true);
  });

  it('desactiva cargandoPeriodo al completar', () => {
    iniciarYCompletarCarga();

    expect(componente.cargandoPeriodo()).toBe(false);
  });

  it('guarda el periodo original', () => {
    const periodo = crearPeriodo({ id: 15 });

    iniciarYCompletarCarga(periodo);

    expect(componente.periodoOriginal()).toBe(periodo);
  });

  it('rellena codigo', () => {
    iniciarYCompletarCarga(crearPeriodo({ codigo: '2027-1' }));

    expect(componente.formularioPeriodo.controls.codigo.value).toBe('2027-1');
  });

  it('rellena nombre', () => {
    iniciarYCompletarCarga(crearPeriodo({ nombre: 'Primer periodo 2027' }));

    expect(componente.formularioPeriodo.controls.nombre.value)
      .toBe('Primer periodo 2027');
  });

  it('rellena fecha inicial', () => {
    iniciarYCompletarCarga(crearPeriodo({ fecha_inicio: '2027-01-01' }));

    expect(componente.formularioPeriodo.controls.fechaInicio.value)
      .toBe('2027-01-01');
  });

  it('rellena fecha final', () => {
    iniciarYCompletarCarga(crearPeriodo({ fecha_fin: '2027-06-30' }));

    expect(componente.formularioPeriodo.controls.fechaFin.value)
      .toBe('2027-06-30');
  });

  it('convierte inicio de matricula a datetime-local', () => {
    iniciarYCompletarCarga(crearPeriodo({
      fecha_inicio_matricula: '2027-01-01T08:30:00.000Z',
    }));

    expect(componente.formularioPeriodo.controls.fechaInicioMatricula.value)
      .toBe('2027-01-01T08:30');
  });

  it('convierte fin de matricula a datetime-local', () => {
    iniciarYCompletarCarga(crearPeriodo({
      fecha_fin_matricula: '2027-01-31T23:45:00.000Z',
    }));

    expect(componente.formularioPeriodo.controls.fechaFinMatricula.value)
      .toBe('2027-01-31T23:45');
  });

  it('no desplaza horas por zona local', () => {
    iniciarYCompletarCarga(crearPeriodo({
      fecha_inicio_matricula: '2027-01-01T00:30:00.000Z',
    }));

    expect(componente.formularioPeriodo.controls.fechaInicioMatricula.value)
      .toBe('2027-01-01T00:30');
  });

  it('no modifica el objeto recibido', () => {
    const periodo = crearPeriodo({
      codigo: '  2027-1  ',
      nombre: '  Primer   periodo 2027  ',
    });
    const copia = { ...periodo };

    iniciarYCompletarCarga(periodo);

    expect(periodo).toEqual(copia);
  });

  it('marca el formulario como no modificado despues de cargar', () => {
    iniciarYCompletarCarga();

    expect(componente.formularioPeriodo.pristine).toBe(true);
  });

  it('no crea control de estado', () => {
    expect(componente.formularioPeriodo.get('estado')).toBeNull();
  });

  it('ignora cursos para el formulario', () => {
    type PeriodoConCursos = PeriodoAcademico & { cursos: [{ id: number }] };
    const periodo: PeriodoConCursos = {
      ...crearPeriodo(),
      cursos: [{ id: 1 }],
    };

    iniciarYCompletarCarga(periodo);

    expect(componente.formularioPeriodo.get('cursos')).toBeNull();
  });

  it('maneja una fecha recibida invalida', () => {
    iniciarComponente();
    solicitudesCarga[0].next(crearRespuestaPeriodo(crearPeriodo({
      fecha_inicio_matricula: 'fecha invalida',
    })));
    solicitudesCarga[0].complete();

    expect(componente.periodoOriginal()).toBeNull();
    expect(componente.mensajeError()).toBe(
      'No fue posible interpretar las fechas del periodo académico.',
    );
  });

  it('evita cargas duplicadas', () => {
    iniciarComponente();

    componente.ngOnInit();

    expect(periodosAcademicosService.obtenerPeriodoPorId).toHaveBeenCalledTimes(1);
  });

  it('codigo obligatorio', () => {
    componente.formularioPeriodo.patchValue({ codigo: '' });

    expect(componente.formularioPeriodo.controls.codigo.hasError('required'))
      .toBe(true);
  });

  it('codigo maximo 20', () => {
    componente.formularioPeriodo.patchValue({ codigo: 'A'.repeat(21) });

    expect(componente.formularioPeriodo.controls.codigo.hasError('maxlength'))
      .toBe(true);
  });

  it('nombre obligatorio', () => {
    componente.formularioPeriodo.patchValue({ nombre: '' });

    expect(componente.formularioPeriodo.controls.nombre.hasError('required'))
      .toBe(true);
  });

  it('nombre maximo 100', () => {
    componente.formularioPeriodo.patchValue({ nombre: 'A'.repeat(101) });

    expect(componente.formularioPeriodo.controls.nombre.hasError('maxlength'))
      .toBe(true);
  });

  it('fechas obligatorias', () => {
    componente.formularioPeriodo.patchValue({
      fechaInicio: '',
      fechaFin: '',
      fechaInicioMatricula: '',
      fechaFinMatricula: '',
    });

    expect(componente.formularioPeriodo.controls.fechaInicio.hasError('required'))
      .toBe(true);
    expect(componente.formularioPeriodo.controls.fechaFin.hasError('required'))
      .toBe(true);
    expect(
      componente.formularioPeriodo.controls.fechaInicioMatricula
        .hasError('required'),
    ).toBe(true);
    expect(
      componente.formularioPeriodo.controls.fechaFinMatricula
        .hasError('required'),
    ).toBe(true);
  });

  it('rechaza periodo con fechas iguales', () => {
    completarFormularioValido();
    componente.formularioPeriodo.patchValue({
      fechaInicio: '2027-01-01',
      fechaFin: '2027-01-01',
    });

    expect(componente.formularioPeriodo.hasError('rangoPeriodoInvalido'))
      .toBe(true);
  });

  it('rechaza inicio posterior al fin', () => {
    completarFormularioValido();
    componente.formularioPeriodo.patchValue({
      fechaInicio: '2027-06-30',
      fechaFin: '2027-01-01',
    });

    expect(componente.formularioPeriodo.hasError('rangoPeriodoInvalido'))
      .toBe(true);
  });

  it('rechaza matricula invertida', () => {
    completarFormularioValido();
    componente.formularioPeriodo.patchValue({
      fechaInicioMatricula: '2027-01-20T08:00',
      fechaFinMatricula: '2027-01-10T08:00',
    });

    expect(componente.formularioPeriodo.hasError('rangoMatriculaInvalido'))
      .toBe(true);
  });

  it('rechaza matricula fuera del periodo', () => {
    completarFormularioValido();
    componente.formularioPeriodo.patchValue({
      fechaInicioMatricula: '2026-12-31T23:59',
    });

    expect(componente.formularioPeriodo.hasError('matriculaFueraPeriodo'))
      .toBe(true);
  });

  it('acepta fechas validas', () => {
    completarFormularioValido();

    expect(componente.formularioPeriodo.valid).toBe(true);
  });

  it('conversion a ISO agrega segundos y milisegundos', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({
      fechaInicioMatricula: '2027-01-01T08:31',
    });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()?.fecha_inicio_matricula)
      .toBe('2027-01-01T08:31:00.000Z');
  });

  it('conversion inversa conserva hora UTC', () => {
    iniciarYCompletarCarga(crearPeriodo({
      fecha_fin_matricula: '2027-01-31T03:05:00.000Z',
    }));

    expect(componente.formularioPeriodo.controls.fechaFinMatricula.value)
      .toBe('2027-01-31T03:05');
  });

  it('sin cambios no llama al servicio', () => {
    iniciarYCompletarCarga();

    componente.guardarCambios();

    expect(periodosAcademicosService.actualizarPeriodo).not.toHaveBeenCalled();
  });

  it('sin cambios muestra aviso', () => {
    iniciarYCompletarCarga();

    componente.guardarCambios();

    expect(componente.mensajeAviso()).toBe('No existen cambios para guardar.');
  });

  it('cambiar solo codigo envia solo codigo', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ codigo: '2027-2' });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({ codigo: '2027-2' });
  });

  it('normaliza codigo a mayusculas', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ codigo: ' abc-1 ' });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({ codigo: 'ABC-1' });
  });

  it('cambiar solo nombre envia solo nombre', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      nombre: 'Periodo actualizado',
    });
  });

  it('normaliza espacios del nombre', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({
      nombre: '  Periodo   actualizado  ',
    });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      nombre: 'Periodo actualizado',
    });
  });

  it('cambiar solo fecha inicial envia solo fecha_inicio', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ fechaInicio: '2026-12-31' });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      fecha_inicio: '2026-12-31',
    });
  });

  it('cambiar solo fecha final envia solo fecha_fin', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ fechaFin: '2027-07-01' });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      fecha_fin: '2027-07-01',
    });
  });

  it('cambiar inicio de matricula envia solo su campo', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({
      fechaInicioMatricula: '2027-01-01T09:00',
    });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      fecha_inicio_matricula: '2027-01-01T09:00:00.000Z',
    });
  });

  it('cambiar fin de matricula envia solo su campo', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({
      fechaFinMatricula: '2027-01-31T22:00',
    });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      fecha_fin_matricula: '2027-01-31T22:00:00.000Z',
    });
  });

  it('varios cambios se envian juntos', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({
      codigo: '2027-2',
      nombre: 'Periodo actualizado',
      fechaFin: '2027-07-01',
    });

    componente.guardarCambios();

    expect(obtenerSolicitudActualizacion()).toEqual({
      codigo: '2027-2',
      nombre: 'Periodo actualizado',
      fecha_fin: '2027-07-01',
    });
  });

  it.each([
    'estado',
    'id',
    'created_at',
    'updated_at',
    'cursos',
  ])('no envia %s', (propiedad) => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });

    componente.guardarCambios();

    expect(propiedad in (obtenerSolicitudActualizacion() ?? {})).toBe(false);
  });

  it('no modifica el periodo original', () => {
    const periodo = crearPeriodo();
    const copia = { ...periodo };
    iniciarYCompletarCarga(periodo);
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });

    componente.guardarCambios();

    expect(periodo).toEqual(copia);
  });

  it('no modifica los controles del formulario', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({
      codigo: ' abc-1 ',
      nombre: '  Periodo   actualizado  ',
    });

    componente.guardarCambios();

    expect(componente.formularioPeriodo.controls.codigo.value).toBe(' abc-1 ');
    expect(componente.formularioPeriodo.controls.nombre.value)
      .toBe('  Periodo   actualizado  ');
  });

  it('usa el ID correcto al actualizar', () => {
    idRuta = '25';
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });

    componente.guardarCambios();

    expect(periodosAcademicosService.actualizarPeriodo)
      .toHaveBeenCalledWith(25, { nombre: 'Periodo actualizado' });
  });

  it('llama una sola vez al actualizar', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });

    componente.guardarCambios();

    expect(periodosAcademicosService.actualizarPeriodo).toHaveBeenCalledTimes(1);
  });

  it('activa actualizandoPeriodo', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });

    componente.guardarCambios();

    expect(componente.actualizandoPeriodo()).toBe(true);
  });

  it('desactiva actualizandoPeriodo al finalizar', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    solicitudesActualizacion[0].complete();

    expect(componente.actualizandoPeriodo()).toBe(false);
  });

  it('evita un segundo envio', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    componente.guardarCambios();

    expect(periodosAcademicosService.actualizarPeriodo).toHaveBeenCalledTimes(1);
  });

  it('navega a periodos academicos al completar', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    solicitudesActualizacion[0].next(crearRespuestaPeriodo());
    solicitudesActualizacion[0].complete();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/periodos-academicos');
  });

  it('navega una sola vez', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    solicitudesActualizacion[0].next(crearRespuestaPeriodo());
    solicitudesActualizacion[0].complete();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('conserva valores ante error', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    solicitudesActualizacion[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.formularioPeriodo.controls.nombre.value)
      .toBe('Periodo actualizado');
    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('permite reintentar', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();
    solicitudesActualizacion[0].error(new HttpErrorResponse({ status: 500 }));

    componente.guardarCambios();

    expect(periodosAcademicosService.actualizarPeriodo).toHaveBeenCalledTimes(2);
  });

  it('formulario invalido no actualiza', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ codigo: '' });

    componente.guardarCambios();

    expect(periodosAcademicosService.actualizarPeriodo).not.toHaveBeenCalled();
    expect(componente.formularioPeriodo.touched).toBe(true);
    expect(componente.actualizandoPeriodo()).toBe(false);
  });

  it.each([
    [
      new HttpErrorResponse({ status: 0 }),
      'No fue posible conectar con el servidor.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'PERIODO_FECHAS_INVALIDAS' },
      }),
      'Las fechas ingresadas no son válidas.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'PERIODO_RANGO_INVALIDO' },
      }),
      'La fecha de inicio debe ser anterior a la fecha de fin.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'PERIODO_MATRICULA_RANGO_INVALIDO' },
      }),
      'El inicio de matrícula debe ser anterior al fin de matrícula.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'PERIODO_MATRICULA_FUERA_DE_RANGO' },
      }),
      'La ventana de matrícula debe estar dentro del periodo académico.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'EMPTY_UPDATE_PAYLOAD' },
      }),
      'No existen cambios válidos para guardar.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'UNKNOWN_FIELDS' },
      }),
      'La solicitud contiene campos no permitidos.',
    ],
    [
      new HttpErrorResponse({
        status: 404,
        error: { code: 'PERIODO_ACADEMICO_NOT_FOUND' },
      }),
      'El periodo académico solicitado no existe.',
    ],
    [
      new HttpErrorResponse({
        status: 409,
        error: { code: 'PERIODO_CODIGO_DUPLICATED' },
      }),
      'El código del periodo académico ya está registrado.',
    ],
    [
      new HttpErrorResponse({
        status: 409,
        error: { code: 'PERIODO_FECHAS_CON_DEPENDENCIAS' },
      }),
      'No se pueden modificar las fechas porque el periodo académico tiene cursos o matrículas asociados.',
    ],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para editar periodos académicos.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al actualizar el periodo académico.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: 'texto no estructurado' }),
      'Revise los datos del periodo académico.',
    ],
  ])('maneja error de actualizacion', (error, mensaje) => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    solicitudesActualizacion[0].error(error);

    expect(componente.mensajeError()).toBe(mensaje);
  });

  it('muestra cantidades de dependencias validas', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ fechaFin: '2027-07-01' });
    componente.guardarCambios();

    solicitudesActualizacion[0].error(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'PERIODO_FECHAS_CON_DEPENDENCIAS',
        details: {
          cursos: 3,
          matriculas: 25,
        },
      },
    }));

    expect(componente.mensajeError()).toContain('Cursos asociados: 3.');
    expect(componente.mensajeError()).toContain('Matrículas asociadas: 25.');
  });

  it('ignora cantidades de dependencias no validas', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ fechaFin: '2027-07-01' });
    componente.guardarCambios();

    solicitudesActualizacion[0].error(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'PERIODO_FECHAS_CON_DEPENDENCIAS',
        details: {
          cursos: '3',
          matriculas: -1,
        },
      },
    }));

    expect(componente.mensajeError()).toBe(
      'No se pueden modificar las fechas porque el periodo académico tiene cursos o matrículas asociados.',
    );
  });

  it('no muestra informacion interna', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();

    solicitudesActualizacion[0].error(new HttpErrorResponse({
      status: 400,
      error: {
        message: 'token stack trace secret',
        details: ['consulta interna token'],
      },
    }));

    expect(componente.mensajeError()).toBe(
      'Revise los datos del periodo académico.',
    );
  });

  it.each([
    [
      new HttpErrorResponse({ status: 0 }),
      'No fue posible conectar con el servidor.',
    ],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para consultar el periodo académico.',
    ],
    [
      new HttpErrorResponse({
        status: 404,
        error: { code: 'PERIODO_ACADEMICO_NOT_FOUND' },
      }),
      'El periodo académico solicitado no existe.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al consultar el periodo académico.',
    ],
  ])('maneja error de carga', (error, mensaje) => {
    iniciarComponente();

    solicitudesCarga[0].error(error);

    expect(componente.periodoOriginal()).toBeNull();
    expect(componente.mensajeError()).toBe(mensaje);
    expect(componente.cargandoPeriodo()).toBe(false);
  });

  it('existe h1 Editar periodo academico', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain(
      'Editar periodo académico',
    );
  });

  it('muestra identificador', () => {
    iniciarYCompletarCarga(crearPeriodo({ id: 15 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Identificador: 15');
  });

  it('muestra estado como texto', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Estado actual: Matrícula abierta');
  });

  it('no existe select de estado', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();
    const selectorEstado = `select[formControlName="${'estado'}"]`;

    expect(obtenerElemento(selectorEstado)).toBeNull();
  });

  it('existen seis campos editables', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="codigo"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="nombre"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="fechaInicio"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="fechaFin"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="fechaInicioMatricula"]'))
      .toBeTruthy();
    expect(obtenerElemento('input[formControlName="fechaFinMatricula"]'))
      .toBeTruthy();
  });

  it('existen dos inputs date', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerElementos('input[type="date"]')).toHaveLength(2);
  });

  it('existen dos inputs datetime-local', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerElementos('input[type="datetime-local"]')).toHaveLength(2);
  });

  it('existe informacion sobre dependencias', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'Las fechas no podrán modificarse si el periodo ya tiene cursos o matrículas asociados.',
    );
  });

  it('existe boton Guardar cambios', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerBoton('Guardar cambios')).toBeTruthy();
  });

  it('existe enlace Cancelar', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerEnlace('Cancelar')).toBeTruthy();
  });

  it('existe enlace Volver', () => {
    iniciarComponente();
    solicitudesCarga[0].error(new HttpErrorResponse({ status: 404 }));
    fixture.detectChanges();

    expect(obtenerEnlace('Volver a periodos académicos')).toBeTruthy();
  });

  it('muestra Guardando cambios', () => {
    iniciarYCompletarCarga();
    componente.formularioPeriodo.patchValue({ nombre: 'Periodo actualizado' });
    componente.guardarCambios();
    fixture.detectChanges();

    expect(obtenerBoton('Guardando cambios...')).toBeTruthy();
  });

  it('existe error con role alert', () => {
    iniciarComponente();
    solicitudesCarga[0].error(new HttpErrorResponse({ status: 404 }));
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]')?.textContent).toContain(
      'El periodo académico solicitado no existe.',
    );
  });

  it('existe aviso con role status', () => {
    iniciarYCompletarCarga();
    componente.guardarCambios();
    fixture.detectChanges();

    expect(obtenerElemento('[role="status"]')?.textContent).toContain(
      'No existen cambios para guardar.',
    );
  });

  it('no existe boton de transicion', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Cambiar estado');
  });

  it('no existe boton eliminar', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerBoton('Eliminar')).toBeNull();
  });

  it('no existen estilos configurados', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('style')).toBeNull();
  });

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarYCompletarCarga(periodo = crearPeriodo()): void {
    iniciarComponente();
    solicitudesCarga[solicitudesCarga.length - 1].next(
      crearRespuestaPeriodo(periodo),
    );
    solicitudesCarga[solicitudesCarga.length - 1].complete();
    fixture.detectChanges();
  }

  function completarFormularioValido(): void {
    componente.formularioPeriodo.patchValue({
      codigo: '2027-1',
      nombre: 'Primer periodo 2027',
      fechaInicio: '2027-01-01',
      fechaFin: '2027-06-30',
      fechaInicioMatricula: '2027-01-01T08:00',
      fechaFinMatricula: '2027-01-31T23:00',
    });
  }

  function obtenerSolicitudActualizacion():
    ActualizarPeriodoAcademicoSolicitud | undefined {
    const llamadas = periodosAcademicosService.actualizarPeriodo.mock.calls;

    return llamadas[llamadas.length - 1]?.[1];
  }

  function obtenerElemento<T extends Element = Element>(
    selector: string,
  ): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function obtenerElementos<T extends Element = Element>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = obtenerElementos<HTMLButtonElement>('button');

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    const enlaces = obtenerElementos<HTMLAnchorElement>('a');

    return enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null;
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function crearPeriodo(
  parcial: Partial<PeriodoAcademico> = {},
): PeriodoAcademico {
  return {
    id: 15,
    codigo: '2027-1',
    nombre: 'Primer periodo 2027',
    fecha_inicio: '2027-01-01',
    fecha_fin: '2027-06-30',
    fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
    fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
    estado: 'planificado',
    created_at: '2026-08-03T00:00:00.000Z',
    updated_at: '2026-08-03T00:00:00.000Z',
    ...parcial,
  };
}

function crearRespuestaPeriodo(
  periodo = crearPeriodo(),
): RespuestaPeriodoAcademico {
  return {
    success: true,
    message: 'Periodo academico actualizado correctamente.',
    data: periodo,
  };
}
