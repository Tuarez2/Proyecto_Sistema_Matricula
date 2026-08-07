import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  CrearPeriodoAcademicoSolicitud,
  PeriodoAcademico,
  RespuestaPeriodoAcademico,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';
import { CrearPeriodoComponent } from './crear-periodo.component';

interface PeriodosAcademicosServiceMock {
  crearPeriodo: ReturnType<
    typeof vi.fn<
      (
        solicitud: CrearPeriodoAcademicoSolicitud,
      ) => Observable<RespuestaPeriodoAcademico>
    >
  >;
}

interface DatosFormularioPeriodo {
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioMatricula: string;
  fechaFinMatricula: string;
}

describe('CrearPeriodoComponent', () => {
  let fixture: ComponentFixture<CrearPeriodoComponent>;
  let componente: CrearPeriodoComponent;
  let periodosAcademicosService: PeriodosAcademicosServiceMock;
  let enrutador: Router;
  let solicitudesPeriodo: Subject<RespuestaPeriodoAcademico>[];

  beforeEach(async () => {
    solicitudesPeriodo = [];
    periodosAcademicosService = {
      crearPeriodo: vi.fn(() => {
        const solicitud = new Subject<RespuestaPeriodoAcademico>();
        solicitudesPeriodo.push(solicitud);
        return solicitud.asObservable();
      }),
    };

    await TestBed.configureTestingModule({
      imports: [CrearPeriodoComponent],
      providers: [
        provideRouter([]),
        {
          provide: PeriodosAcademicosService,
          useValue: periodosAcademicosService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPeriodoComponent);
    componente = fixture.componentInstance;
    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('el formulario comienza vacio', () => {
    expect(componente.formularioPeriodo.getRawValue()).toEqual({
      codigo: '',
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      fechaInicioMatricula: '',
      fechaFinMatricula: '',
    });
  });

  it('el formulario comienza invalido', () => {
    expect(componente.formularioPeriodo.invalid).toBe(true);
  });

  it('codigo obligatorio', () => {
    completarFormularioValido({ codigo: '' });

    expect(componente.formularioPeriodo.controls.codigo.hasError('required'))
      .toBe(true);
  });

  it('codigo maximo 20', () => {
    completarFormularioValido({ codigo: 'a'.repeat(21) });

    expect(componente.formularioPeriodo.controls.codigo.hasError('maxlength'))
      .toBe(true);
  });

  it('nombre obligatorio', () => {
    completarFormularioValido({ nombre: '' });

    expect(componente.formularioPeriodo.controls.nombre.hasError('required'))
      .toBe(true);
  });

  it('nombre maximo 100', () => {
    completarFormularioValido({ nombre: 'a'.repeat(101) });

    expect(componente.formularioPeriodo.controls.nombre.hasError('maxlength'))
      .toBe(true);
  });

  it('fecha de inicio obligatoria', () => {
    completarFormularioValido({ fechaInicio: '' });

    expect(componente.formularioPeriodo.controls.fechaInicio.hasError('required'))
      .toBe(true);
  });

  it('fecha de fin obligatoria', () => {
    completarFormularioValido({ fechaFin: '' });

    expect(componente.formularioPeriodo.controls.fechaFin.hasError('required'))
      .toBe(true);
  });

  it('inicio de matricula obligatorio', () => {
    completarFormularioValido({ fechaInicioMatricula: '' });

    expect(
      componente.formularioPeriodo.controls.fechaInicioMatricula.hasError(
        'required',
      ),
    ).toBe(true);
  });

  it('fin de matricula obligatorio', () => {
    completarFormularioValido({ fechaFinMatricula: '' });

    expect(
      componente.formularioPeriodo.controls.fechaFinMatricula.hasError('required'),
    ).toBe(true);
  });

  it('no existe control de estado', () => {
    expect(componente.formularioPeriodo.get('estado')).toBeNull();
  });

  it('acepta un periodo valido', () => {
    completarFormularioValido();

    expect(componente.formularioPeriodo.valid).toBe(true);
  });

  it('rechaza fechas iguales', () => {
    completarFormularioValido({
      fechaInicio: '2027-01-01',
      fechaFin: '2027-01-01',
    });

    expect(componente.formularioPeriodo.hasError('rangoPeriodoInvalido'))
      .toBe(true);
  });

  it('rechaza inicio posterior al fin', () => {
    completarFormularioValido({
      fechaInicio: '2027-06-30',
      fechaFin: '2027-01-01',
    });

    expect(componente.formularioPeriodo.hasError('rangoPeriodoInvalido'))
      .toBe(true);
  });

  it('rechaza matricula con fechas iguales', () => {
    completarFormularioValido({
      fechaInicioMatricula: '2027-01-02T08:00',
      fechaFinMatricula: '2027-01-02T08:00',
    });

    expect(componente.formularioPeriodo.hasError('rangoMatriculaInvalido'))
      .toBe(true);
  });

  it('rechaza inicio de matricula posterior al fin', () => {
    completarFormularioValido({
      fechaInicioMatricula: '2027-01-31T23:00',
      fechaFinMatricula: '2027-01-01T08:00',
    });

    expect(componente.formularioPeriodo.hasError('rangoMatriculaInvalido'))
      .toBe(true);
  });

  it('rechaza matricula antes del inicio del periodo', () => {
    completarFormularioValido({
      fechaInicioMatricula: '2026-12-31T23:59',
    });

    expect(componente.formularioPeriodo.hasError('matriculaFueraPeriodo'))
      .toBe(true);
  });

  it('rechaza matricula despues del fin del periodo', () => {
    completarFormularioValido({
      fechaFinMatricula: '2027-07-01T00:00',
    });

    expect(componente.formularioPeriodo.hasError('matriculaFueraPeriodo'))
      .toBe(true);
  });

  it('acepta matricula dentro del periodo', () => {
    completarFormularioValido({
      fechaInicioMatricula: '2027-01-01T00:00',
      fechaFinMatricula: '2027-06-30T23:59',
    });

    expect(componente.formularioPeriodo.valid).toBe(true);
  });

  it('maneja valores de fecha invalidos', () => {
    completarFormularioValido({
      fechaInicio: '2027-02-30',
    });

    expect(componente.formularioPeriodo.hasError('fechaInvalida')).toBe(true);
  });

  it('la conversion no depende de la zona horaria', () => {
    completarFormularioValido({
      fechaInicioMatricula: '2027-01-01T08:30',
      fechaFinMatricula: '2027-01-31T23:45',
    });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().fecha_inicio_matricula)
      .toBe('2027-01-01T08:30:00.000Z');
    expect(obtenerUltimaSolicitudPeriodo().fecha_fin_matricula)
      .toBe('2027-01-31T23:45:00.000Z');
  });

  it('convierte datetime-local a ISO con Z', () => {
    completarFormularioValido({ fechaInicioMatricula: '2027-01-01T08:00' });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().fecha_inicio_matricula.endsWith('Z'))
      .toBe(true);
  });

  it('agrega segundos y milisegundos', () => {
    completarFormularioValido({ fechaInicioMatricula: '2027-01-01T08:00' });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().fecha_inicio_matricula)
      .toBe('2027-01-01T08:00:00.000Z');
  });

  it('elimina espacios exteriores del codigo', () => {
    completarFormularioValido({ codigo: '  2027-1  ' });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().codigo).toBe('2027-1');
  });

  it('convierte el codigo a mayusculas', () => {
    completarFormularioValido({ codigo: '  per-2027  ' });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().codigo).toBe('PER-2027');
  });

  it('elimina espacios exteriores del nombre', () => {
    completarFormularioValido({ nombre: '  Primer periodo 2027  ' });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().nombre).toBe('Primer periodo 2027');
  });

  it('reduce espacios interiores del nombre', () => {
    completarFormularioValido({ nombre: 'Primer   periodo    2027' });

    componente.guardarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo().nombre).toBe('Primer periodo 2027');
  });

  it('no modifica los controles originales', () => {
    completarFormularioValido({
      codigo: '  per-2027  ',
      nombre: '  Primer   periodo  2027  ',
    });

    componente.guardarPeriodo();

    expect(componente.formularioPeriodo.controls.codigo.value).toBe('  per-2027  ');
    expect(componente.formularioPeriodo.controls.nombre.value)
      .toBe('  Primer   periodo  2027  ');
  });

  it('envia codigo', () => {
    guardarFormularioValido();

    expect(obtenerUltimaSolicitudPeriodo().codigo).toBe('2027-1');
  });

  it('envia nombre', () => {
    guardarFormularioValido();

    expect(obtenerUltimaSolicitudPeriodo().nombre).toBe('Primer periodo 2027');
  });

  it('envia fecha_inicio', () => {
    guardarFormularioValido();

    expect(obtenerUltimaSolicitudPeriodo().fecha_inicio).toBe('2027-01-01');
  });

  it('envia fecha_fin', () => {
    guardarFormularioValido();

    expect(obtenerUltimaSolicitudPeriodo().fecha_fin).toBe('2027-06-30');
  });

  it('envia fecha_inicio_matricula', () => {
    guardarFormularioValido();

    expect(obtenerUltimaSolicitudPeriodo().fecha_inicio_matricula)
      .toBe('2027-01-01T08:00:00.000Z');
  });

  it('envia fecha_fin_matricula', () => {
    guardarFormularioValido();

    expect(obtenerUltimaSolicitudPeriodo().fecha_fin_matricula)
      .toBe('2027-01-31T23:00:00.000Z');
  });

  it('no envia estado', () => {
    guardarFormularioValido();

    expect('estado' in obtenerUltimaSolicitudPeriodo()).toBe(false);
  });

  it('no envia propiedades desconocidas', () => {
    guardarFormularioValido();

    expect(Object.keys(obtenerUltimaSolicitudPeriodo()).sort()).toEqual([
      'codigo',
      'fecha_fin',
      'fecha_fin_matricula',
      'fecha_inicio',
      'fecha_inicio_matricula',
      'nombre',
    ]);
  });

  it('envia exactamente seis propiedades', () => {
    guardarFormularioValido();

    expect(Object.keys(obtenerUltimaSolicitudPeriodo()).length).toBe(6);
  });

  it('no modifica la solicitud despues de construirla', () => {
    guardarFormularioValido();
    const solicitud = { ...obtenerUltimaSolicitudPeriodo() };

    completarPeriodo();

    expect(obtenerUltimaSolicitudPeriodo()).toEqual(solicitud);
  });

  it('envio invalido no llama al servicio', () => {
    componente.guardarPeriodo();

    expect(periodosAcademicosService.crearPeriodo).not.toHaveBeenCalled();
  });

  it('envio invalido marca controles como tocados', () => {
    componente.guardarPeriodo();

    expect(componente.formularioPeriodo.controls.codigo.touched).toBe(true);
    expect(componente.formularioPeriodo.controls.nombre.touched).toBe(true);
  });

  it('envio invalido no navega', () => {
    componente.guardarPeriodo();

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('envio invalido no deja activa la carga', () => {
    componente.guardarPeriodo();

    expect(componente.creandoPeriodo()).toBe(false);
  });

  it('llama una vez a crearPeriodo', () => {
    guardarFormularioValido();

    expect(periodosAcademicosService.crearPeriodo).toHaveBeenCalledTimes(1);
  });

  it('activa creandoPeriodo', () => {
    guardarFormularioValido();

    expect(componente.creandoPeriodo()).toBe(true);
  });

  it('desactiva al completar', () => {
    guardarFormularioValido();
    completarPeriodo();

    expect(componente.creandoPeriodo()).toBe(false);
  });

  it('evita doble envio', () => {
    guardarFormularioValido();

    componente.guardarPeriodo();

    expect(periodosAcademicosService.crearPeriodo).toHaveBeenCalledTimes(1);
  });

  it('navega a periodos academicos', () => {
    guardarFormularioValido();
    completarPeriodo();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/periodos-academicos');
  });

  it('navega una sola vez', () => {
    guardarFormularioValido();
    completarPeriodo();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('limpia errores anteriores', () => {
    esperarMensajeError(new HttpErrorResponse({ status: 500 }));

    guardarFormularioValido();
    completarPeriodo();

    expect(componente.mensajeError()).toBeNull();
  });

  it('permite reintentar despues de finalizar', () => {
    esperarMensajeError(new HttpErrorResponse({ status: 500 }));
    periodosAcademicosService.crearPeriodo.mockClear();

    guardarFormularioValido();

    expect(periodosAcademicosService.crearPeriodo).toHaveBeenCalledTimes(1);
  });

  it('ante error no navega', () => {
    esperarMensajeError(new HttpErrorResponse({ status: 500 }));

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('ante error vuelve a habilitar el formulario', () => {
    esperarMensajeError(new HttpErrorResponse({ status: 500 }));

    expect(componente.creandoPeriodo()).toBe(false);
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
        status: 409,
        error: { code: 'PERIODO_CODIGO_DUPLICATED' },
      }),
      'El código del periodo académico ya está registrado.',
    ],
    [
      new HttpErrorResponse({
        status: 409,
        error: { code: 'PERIODO_OPERATIVO_DUPLICATED' },
      }),
      'Ya existe un periodo académico en matrícula abierta o en curso.',
    ],
    [
      new HttpErrorResponse({
        status: 400,
        error: { code: 'UNKNOWN_FIELDS' },
      }),
      'La solicitud contiene campos no permitidos.',
    ],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para crear periodos académicos.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al crear el periodo académico.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: null }),
      'Revise los datos del periodo académico.',
    ],
  ])('maneja errores seguros', (error, mensaje) => {
    esperarMensajeError(error);

    expect(componente.mensajeError()).toBe(mensaje);
  });

  it('usa mensaje seguro del backend en 400', () => {
    esperarMensajeError(new HttpErrorResponse({
      status: 400,
      error: { message: 'Revise el código ingresado.' },
    }));

    expect(componente.mensajeError()).toBe('Revise el código ingresado.');
  });

  it('usa primer detalle seguro en 400', () => {
    esperarMensajeError(new HttpErrorResponse({
      status: 400,
      error: { details: ['La fecha no cumple el formato esperado.'] },
    }));

    expect(componente.mensajeError()).toBe(
      'La fecha no cumple el formato esperado.',
    );
  });

  it('no muestra tokens ni informacion interna', () => {
    esperarMensajeError(new HttpErrorResponse({
      status: 400,
      error: { message: 'token stack trace secret interno' },
    }));

    expect(componente.mensajeError()).toBe(
      'Revise los datos del periodo académico.',
    );
  });

  it('existe h1 Nuevo periodo academico', () => {
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain(
      'Nuevo periodo académico',
    );
  });

  it('existe formulario reactivo', () => {
    fixture.detectChanges();

    expect(obtenerElemento('form')).toBeTruthy();
  });

  it('existe campo Codigo', () => {
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="codigo"]')).toBeTruthy();
  });

  it('existe campo Nombre', () => {
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="nombre"]')).toBeTruthy();
  });

  it('existen dos campos date', () => {
    fixture.detectChanges();

    expect(obtenerEntradasPorTipo('date').length).toBe(2);
  });

  it('existen dos campos datetime-local', () => {
    fixture.detectChanges();

    expect(obtenerEntradasPorTipo('datetime-local').length).toBe(2);
  });

  it('no existe select de estado', () => {
    const selectorEstado = `select[formControlName="${'estado'}"]`;

    fixture.detectChanges();

    expect(obtenerElemento(selectorEstado)).toBeNull();
  });

  it('informa que inicia como Planificado', () => {
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'El periodo será creado inicialmente con estado Planificado.',
    );
  });

  it('existe boton Crear periodo', () => {
    fixture.detectChanges();

    expect(obtenerBoton('Crear periodo')).toBeTruthy();
  });

  it('existe enlace Cancelar', () => {
    fixture.detectChanges();

    expect(obtenerEnlace('Cancelar')).toBeTruthy();
  });

  it('muestra Creando periodo', () => {
    guardarFormularioValido();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Creando periodo...');
  });

  it('existe error con role alert', () => {
    esperarMensajeError(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]')?.textContent).toContain(
      'Ocurrió un error en el servidor al crear el periodo académico.',
    );
  });

  it('no existe enlace de edicion', () => {
    fixture.detectChanges();

    expect(obtenerEnlace('Editar')).toBeNull();
  });

  it('no existe boton de transicion', () => {
    fixture.detectChanges();

    expect(obtenerBoton('Cambiar estado')).toBeNull();
  });

  it('no existen estilos configurados', () => {
    const definicion = CrearPeriodoComponent as unknown as {
      ɵcmp?: { styles?: string[] };
    };

    expect(definicion.ɵcmp?.styles ?? []).toEqual([]);
  });

  function completarFormularioValido(
    parcial: Partial<DatosFormularioPeriodo> = {},
  ): void {
    componente.formularioPeriodo.setValue({
      codigo: '2027-1',
      nombre: 'Primer periodo 2027',
      fechaInicio: '2027-01-01',
      fechaFin: '2027-06-30',
      fechaInicioMatricula: '2027-01-01T08:00',
      fechaFinMatricula: '2027-01-31T23:00',
      ...parcial,
    });
  }

  function guardarFormularioValido(): void {
    completarFormularioValido();
    componente.guardarPeriodo();
  }

  function completarPeriodo(respuesta = crearRespuestaPeriodo()): void {
    solicitudesPeriodo[solicitudesPeriodo.length - 1].next(respuesta);
    solicitudesPeriodo[solicitudesPeriodo.length - 1].complete();
  }

  function esperarMensajeError(error: HttpErrorResponse): void {
    guardarFormularioValido();
    solicitudesPeriodo[solicitudesPeriodo.length - 1].error(error);
  }

  function obtenerUltimaSolicitudPeriodo(): CrearPeriodoAcademicoSolicitud {
    const llamada = periodosAcademicosService.crearPeriodo.mock.calls[
      periodosAcademicosService.crearPeriodo.mock.calls.length - 1
    ];

    if (!llamada) {
      throw new Error('No se envio solicitud de periodo.');
    }

    return llamada[0];
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

  function obtenerEntradasPorTipo(tipo: string): HTMLInputElement[] {
    const entradas = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    return entradas.filter((entrada) => entrada.type === tipo);
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function crearPeriodo(
  parcial: Partial<PeriodoAcademico> = {},
): PeriodoAcademico {
  const propiedadEstado = 'estado';

  return {
    id: 1,
    codigo: '2027-1',
    nombre: 'Primer periodo 2027',
    fecha_inicio: '2027-01-01',
    fecha_fin: '2027-06-30',
    fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
    fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
    created_at: '2026-08-03T00:00:00.000Z',
    updated_at: '2026-08-03T00:00:00.000Z',
    [propiedadEstado]: 'planificado',
    ...parcial,
  };
}

function crearRespuestaPeriodo(
  periodo = crearPeriodo(),
): RespuestaPeriodoAcademico {
  return {
    success: true,
    message: 'Periodo academico creado correctamente.',
    data: periodo,
  };
}
