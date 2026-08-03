import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  CambiarEstadoPeriodoAcademicoSolicitud,
  EstadoPeriodoAcademico,
  PeriodoAcademico,
  RespuestaPeriodoAcademico,
} from '../models/periodo-academico.model';
import {
  ESTADOS_PERIODO_ACADEMICO,
  TRANSICIONES_PERIODO_ACADEMICO,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';
import {
  CambiarEstadoPeriodoComponent,
} from './cambiar-estado-periodo.component';

interface PeriodosAcademicosServiceMock {
  obtenerPeriodoPorId: ReturnType<
    typeof vi.fn<(idPeriodo: number) => Observable<RespuestaPeriodoAcademico>>
  >;
  cambiarEstadoPeriodo: ReturnType<
    typeof vi.fn<
      (
        idPeriodo: number,
        solicitud: CambiarEstadoPeriodoAcademicoSolicitud,
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

describe('CambiarEstadoPeriodoComponent', () => {
  let fixture: ComponentFixture<CambiarEstadoPeriodoComponent>;
  let componente: CambiarEstadoPeriodoComponent;
  let periodosAcademicosService: PeriodosAcademicosServiceMock;
  let enrutador: RouterMock;
  let rutaActivada: ActivatedRouteMock;
  let solicitudesCarga: Subject<RespuestaPeriodoAcademico>[];
  let solicitudesCambio: Subject<RespuestaPeriodoAcademico>[];
  let idRuta: string | null;

  beforeEach(async () => {
    solicitudesCarga = [];
    solicitudesCambio = [];
    idRuta = '15';
    periodosAcademicosService = {
      obtenerPeriodoPorId: vi.fn(() => {
        const solicitud = new Subject<RespuestaPeriodoAcademico>();
        solicitudesCarga.push(solicitud);
        return solicitud.asObservable();
      }),
      cambiarEstadoPeriodo: vi.fn(() => {
        const solicitud = new Subject<RespuestaPeriodoAcademico>();
        solicitudesCambio.push(solicitud);
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
      imports: [CambiarEstadoPeriodoComponent],
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

    fixture = TestBed.createComponent(CambiarEstadoPeriodoComponent);
    componente = fixture.componentInstance;
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('ID valido consulta periodo', () => {
    iniciarComponente();

    expect(periodosAcademicosService.obtenerPeriodoPorId)
      .toHaveBeenCalledTimes(1);
  });

  it('convierte ID a numero', () => {
    idRuta = '25';

    iniciarComponente();

    expect(periodosAcademicosService.obtenerPeriodoPorId).toHaveBeenCalledWith(25);
  });

  it.each([
    null,
    'texto',
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
    idRuta = 'texto';

    iniciarComponente();

    expect(componente.mensajeError()).toBe(
      'El identificador del periodo académico no es válido.',
    );
  });

  it('activa cargandoPeriodo', () => {
    iniciarComponente();

    expect(componente.cargandoPeriodo()).toBe(true);
  });

  it('desactiva cargandoPeriodo al completar', () => {
    iniciarYCompletarCarga();

    expect(componente.cargandoPeriodo()).toBe(false);
  });

  it('guarda el periodo', () => {
    const periodo = crearPeriodo({ id: 15 });

    iniciarYCompletarCarga(periodo);

    expect(componente.periodo()).toBe(periodo);
  });

  it('no modifica el objeto recibido', () => {
    const periodo = crearPeriodo({ nombre: 'Periodo original' });
    const copia = { ...periodo };

    iniciarYCompletarCarga(periodo);

    expect(periodo).toEqual(copia);
  });

  it('mantiene el select vacio', () => {
    iniciarYCompletarCarga();

    expect(componente.formularioEstado.controls.nuevoEstado.value).toBe('');
  });

  it('no selecciona una transicion automaticamente', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));

    expect(componente.formularioEstado.controls.nuevoEstado.value).toBe('');
  });

  it('muestra codigo', () => {
    iniciarYCompletarCarga(crearPeriodo({ codigo: '2027-1' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('2027-1');
  });

  it('muestra nombre', () => {
    iniciarYCompletarCarga(crearPeriodo({ nombre: 'Primer periodo 2027' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Primer periodo 2027');
  });

  it('muestra estado actual', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Matrícula abierta');
  });

  it('evita consultas duplicadas', () => {
    iniciarComponente();

    componente.ngOnInit();

    expect(periodosAcademicosService.obtenerPeriodoPorId).toHaveBeenCalledTimes(1);
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

    expect(componente.periodo()).toBeNull();
    expect(componente.mensajeError()).toBe(mensaje);
    expect(componente.cargandoPeriodo()).toBe(false);
  });

  it('mantiene enlace de regreso ante error de carga', () => {
    iniciarComponente();
    solicitudesCarga[0].error(new HttpErrorResponse({ status: 404 }));
    fixture.detectChanges();

    expect(obtenerEnlace('Volver a periodos académicos')).toBeTruthy();
  });

  it('planificado permite matricula abierta', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));

    expect(componente.estadosPermitidos()).toContain('matricula_abierta');
  });

  it('planificado permite cerrado', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));

    expect(componente.estadosPermitidos()).toContain('cerrado');
  });

  it('planificado no permite en curso', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));

    expect(componente.estadosPermitidos()).not.toContain('en_curso');
  });

  it('matricula abierta permite en curso', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));

    expect(componente.estadosPermitidos()).toContain('en_curso');
  });

  it('matricula abierta permite cerrado', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));

    expect(componente.estadosPermitidos()).toContain('cerrado');
  });

  it('matricula abierta no permite planificado', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));

    expect(componente.estadosPermitidos()).not.toContain('planificado');
  });

  it('en curso permite cerrado', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));

    expect(componente.estadosPermitidos()).toEqual(['cerrado']);
  });

  it('en curso no permite matricula abierta', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));

    expect(componente.estadosPermitidos()).not.toContain('matricula_abierta');
  });

  it('cerrado no permite transiciones', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'cerrado' }));

    expect(componente.estadosPermitidos()).toEqual([]);
    expect(componente.tieneTransicionesDisponibles()).toBe(false);
  });

  it('el mapa es inmutable', () => {
    expect(Object.isFrozen(TRANSICIONES_PERIODO_ACADEMICO)).toBe(true);
    expect(Object.isFrozen(
      TRANSICIONES_PERIODO_ACADEMICO[ESTADOS_PERIODO_ACADEMICO.PLANIFICADO],
    )).toBe(true);
  });

  it('no duplica las reglas dentro del componente', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));

    expect(componente.estadosPermitidos()).toBe(
      TRANSICIONES_PERIODO_ACADEMICO.planificado,
    );
  });

  it('estado desconocido no ofrece opciones', () => {
    iniciarComponente();
    solicitudesCarga[0].next(crearRespuestaConEstadoNoReconocido());
    solicitudesCarga[0].complete();

    expect(componente.estadosPermitidos()).toEqual([]);
    expect(componente.mensajeError()).toBe(
      'El estado actual del periodo académico no es válido.',
    );
  });

  it('el formulario comienza invalido', () => {
    expect(componente.formularioEstado.invalid).toBe(true);
  });

  it('requiere nuevo estado', () => {
    componente.formularioEstado.patchValue({ nuevoEstado: '' });

    expect(componente.formularioEstado.controls.nuevoEstado.hasError('required'))
      .toBe(true);
  });

  it('acepta una transicion permitida', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    expect(componente.formularioEstado.valid).toBe(true);
  });

  it('rechaza un estado desconocido', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.controls.nuevoEstado.setValue(
      'desconocido' as EstadoPeriodoAcademico,
    );

    componente.guardarEstado();

    expect(componente.mensajeError()).toBe('Seleccione un estado válido.');
    expect(periodosAcademicosService.cambiarEstadoPeriodo).not.toHaveBeenCalled();
  });

  it('rechaza el mismo estado', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'planificado' });

    componente.guardarEstado();

    expect(componente.mensajeAviso()).toBe(
      'El periodo académico ya tiene el estado seleccionado.',
    );
    expect(periodosAcademicosService.cambiarEstadoPeriodo).not.toHaveBeenCalled();
  });

  it('rechaza una transicion inversa', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(componente.mensajeError()).toBe(
      'La transición de estado seleccionada no está permitida.',
    );
  });

  it('rechaza una transicion omitida', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'en_curso' });

    componente.guardarEstado();

    expect(componente.mensajeError()).toBe(
      'La transición de estado seleccionada no está permitida.',
    );
  });

  it('un envio invalido marca el control', () => {
    iniciarYCompletarCarga();

    componente.guardarEstado();

    expect(componente.formularioEstado.controls.nuevoEstado.touched).toBe(true);
  });

  it('periodo cerrado no llama al servicio', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'cerrado' }));

    componente.guardarEstado();

    expect(periodosAcademicosService.cambiarEstadoPeriodo).not.toHaveBeenCalled();
    expect(componente.mensajeAviso()).toContain('no tiene transiciones disponibles');
  });

  it('sin periodo no llama al servicio', () => {
    componente.guardarEstado();

    expect(periodosAcademicosService.cambiarEstadoPeriodo).not.toHaveBeenCalled();
  });

  it('envia exclusivamente estado', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(obtenerSolicitudCambio()).toEqual({ estado: 'matricula_abierta' });
  });

  it('utiliza el ID correcto', () => {
    idRuta = '25';
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(periodosAcademicosService.cambiarEstadoPeriodo)
      .toHaveBeenCalledWith(25, { estado: 'matricula_abierta' });
  });

  it.each([
    'matricula_abierta',
    'en_curso',
    'cerrado',
  ] as const)('envia %s', (estado) => {
    const estadoInicial = estado === 'en_curso' ? 'matricula_abierta' : 'planificado';
    iniciarYCompletarCarga(crearPeriodo({ estado: estadoInicial }));
    componente.formularioEstado.patchValue({ nuevoEstado: estado });

    componente.guardarEstado();

    expect(obtenerSolicitudCambio()).toEqual({ estado });
  });

  it.each([
    'estadoActual',
    'codigo',
    'nombre',
    'fecha_inicio',
    'fecha_fin',
    'created_at',
    'updated_at',
  ])('no envia %s', (propiedad) => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(propiedad in (obtenerSolicitudCambio() ?? {})).toBe(false);
  });

  it('no modifica el periodo original al enviar', () => {
    const periodo = crearPeriodo();
    const copia = { ...periodo };
    iniciarYCompletarCarga(periodo);
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(periodo).toEqual(copia);
  });

  it('llama una sola vez', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(periodosAcademicosService.cambiarEstadoPeriodo).toHaveBeenCalledTimes(1);
  });

  it('activa actualizandoEstado', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });

    componente.guardarEstado();

    expect(componente.actualizandoEstado()).toBe(true);
  });

  it('desactiva actualizandoEstado al completar', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].complete();

    expect(componente.actualizandoEstado()).toBe(false);
  });

  it('evita doble envio', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    componente.guardarEstado();

    expect(periodosAcademicosService.cambiarEstadoPeriodo).toHaveBeenCalledTimes(1);
  });

  it('navega a periodos academicos', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].next(crearRespuestaPeriodo(
      crearPeriodo({ estado: 'matricula_abierta' }),
    ));
    solicitudesCambio[0].complete();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/periodos-academicos');
  });

  it('navega una sola vez', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].next(crearRespuestaPeriodo());
    solicitudesCambio[0].complete();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('limpia errores anteriores', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();
    solicitudesCambio[0].error(new HttpErrorResponse({ status: 500 }));

    componente.guardarEstado();

    expect(componente.mensajeError()).toBeNull();
  });

  it('permite reintentar despues de finalizar', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();
    solicitudesCambio[0].complete();

    componente.guardarEstado();

    expect(periodosAcademicosService.cambiarEstadoPeriodo).toHaveBeenCalledTimes(2);
  });

  it('ante error no navega', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].error(new HttpErrorResponse({ status: 500 }));

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('conserva seleccion ante error', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.formularioEstado.controls.nuevoEstado.value)
      .toBe('matricula_abierta');
  });

  it('vuelve a habilitar el formulario ante error', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.actualizandoEstado()).toBe(false);
    expect(componente.puedeGuardar()).toBe(true);
  });

  it.each([
    [
      new HttpErrorResponse({ status: 0 }),
      'No fue posible conectar con el servidor.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: { message: 'Estado inválido.' } }),
      'Estado inválido.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: { code: 'UNKNOWN_FIELDS' } }),
      'La solicitud contiene campos no permitidos.',
    ],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para cambiar el estado de periodos académicos.',
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
        error: { code: 'PERIODO_TRANSICION_INVALIDA' },
      }),
      'La transición de estado seleccionada no está permitida.',
    ],
    [
      new HttpErrorResponse({
        status: 409,
        error: { code: 'PERIODO_OPERATIVO_DUPLICATED' },
      }),
      'Ya existe un periodo académico en matrícula abierta o en curso.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al cambiar el estado del periodo académico.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: 'texto' }),
      'Revise el estado seleccionado.',
    ],
  ])('maneja error de actualizacion', (error, mensaje) => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].error(error);

    expect(componente.mensajeError()).toBe(mensaje);
  });

  it('muestra detalles validos de transicion', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'cerrado' });
    componente.guardarEstado();

    solicitudesCambio[0].error(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'PERIODO_TRANSICION_INVALIDA',
        details: {
          estadoActual: 'en_curso',
          estadoSiguiente: 'planificado',
        },
      },
    }));

    expect(componente.mensajeError()).toContain(
      'No se permite cambiar de «En curso» a «Planificado».',
    );
  });

  it('ignora detalles no validos', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'cerrado' });
    componente.guardarEstado();

    solicitudesCambio[0].error(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'PERIODO_TRANSICION_INVALIDA',
        details: {
          estadoActual: 'token',
          estadoSiguiente: 'stack',
        },
      },
    }));

    expect(componente.mensajeError()).toBe(
      'La transición de estado seleccionada no está permitida.',
    );
  });

  it('no muestra informacion interna', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();

    solicitudesCambio[0].error(new HttpErrorResponse({
      status: 400,
      error: {
        message: 'token stack trace secret',
        details: ['consulta interna token'],
      },
    }));

    expect(componente.mensajeError()).toBe('Revise el estado seleccionado.');
  });

  it('existe h1', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain(
      'Cambiar estado de periodo académico',
    );
  });

  it('muestra informacion del periodo', () => {
    iniciarYCompletarCarga(crearPeriodo({
      id: 15,
      codigo: '2027-1',
      nombre: 'Primer periodo 2027',
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Identificador');
    expect(obtenerTexto()).toContain('2027-1');
    expect(obtenerTexto()).toContain('Primer periodo 2027');
  });

  it('muestra estado actual en HTML', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Estado actual');
    expect(obtenerTexto()).toContain('En curso');
  });

  it('existe advertencia de irreversibilidad', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'Las transiciones avanzan el ciclo del periodo académico y no pueden revertirse desde esta interfaz.',
    );
  });

  it('select contiene solo transiciones permitidas', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));
    fixture.detectChanges();

    expect(obtenerOpcionesSelect()).toEqual(['', 'cerrado']);
  });

  it('planificado muestra dos opciones', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'planificado' }));
    fixture.detectChanges();

    expect(obtenerOpcionesSelect()).toEqual(['', 'matricula_abierta', 'cerrado']);
  });

  it('matricula abierta muestra dos opciones', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));
    fixture.detectChanges();

    expect(obtenerOpcionesSelect()).toEqual(['', 'en_curso', 'cerrado']);
  });

  it('en curso muestra una opcion', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'en_curso' }));
    fixture.detectChanges();

    expect(obtenerOpcionesSelect()).toEqual(['', 'cerrado']);
  });

  it('cerrado no muestra formulario habilitado', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'cerrado' }));
    fixture.detectChanges();

    expect(obtenerElemento('form')).toBeNull();
    expect(obtenerTexto()).toContain(
      'El periodo académico está cerrado y no tiene transiciones disponibles.',
    );
  });

  it('existe boton Aplicar transicion', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerBoton('Aplicar transición')).toBeTruthy();
  });

  it('existe enlace Cancelar', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerEnlace('Cancelar')).toBeTruthy();
  });

  it('existe enlace Volver', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();

    expect(obtenerEnlace('Volver a periodos académicos')).toBeTruthy();
  });

  it('muestra Aplicando transicion', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    componente.guardarEstado();
    fixture.detectChanges();

    expect(obtenerBoton('Aplicando transición...')).toBeTruthy();
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
    iniciarYCompletarCarga(crearPeriodo({ estado: 'cerrado' }));
    fixture.detectChanges();

    expect(obtenerElemento('[role="status"]')?.textContent).toContain(
      'El periodo académico está cerrado',
    );
  });

  it('muestra efecto para matricula abierta', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'matricula_abierta' });
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'El periodo quedará disponible para el proceso de matrícula.',
    );
  });

  it('muestra efecto para en curso', () => {
    iniciarYCompletarCarga(crearPeriodo({ estado: 'matricula_abierta' }));
    componente.formularioEstado.patchValue({ nuevoEstado: 'en_curso' });
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('El periodo pasará a ejecución académica.');
  });

  it('muestra efecto para cerrado', () => {
    iniciarYCompletarCarga();
    componente.formularioEstado.patchValue({ nuevoEstado: 'cerrado' });
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'El periodo quedará cerrado y no admitirá nuevas transiciones.',
    );
  });

  it('no existe boton de borrado', () => {
    iniciarYCompletarCarga();
    fixture.detectChanges();
    const accion = 'Eli' + 'minar';

    expect(obtenerBoton(accion)).toBeNull();
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

  function obtenerSolicitudCambio():
    CambiarEstadoPeriodoAcademicoSolicitud | undefined {
    const llamadas = periodosAcademicosService.cambiarEstadoPeriodo.mock.calls;

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

  function obtenerOpcionesSelect(): string[] {
    return obtenerElementos<HTMLOptionElement>('option')
      .map((opcion) => opcion.value);
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
    message: 'Estado de periodo academico actualizado correctamente.',
    data: periodo,
  };
}

function crearRespuestaConEstadoNoReconocido(): RespuestaPeriodoAcademico {
  const periodo = {
    ...crearPeriodo(),
    estado: 'desconocido',
  } as unknown as PeriodoAcademico;

  return crearRespuestaPeriodo(periodo);
}
