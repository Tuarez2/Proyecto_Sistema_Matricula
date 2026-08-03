import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  ActualizarPeriodoAcademicoSolicitud,
  CrearPeriodoAcademicoSolicitud,
  FiltrosListadoPeriodos,
  PeriodoAcademico,
  RespuestaListadoPeriodos,
  RespuestaPeriodoAcademico,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from './periodos-academicos.service';

describe('PeriodosAcademicosService', () => {
  let servicio: PeriodosAcademicosService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(PeriodosAcademicosService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('se crea', () => {
    expect(servicio).toBeTruthy();
  });

  it('sin filtros ejecuta GET periodos academicos', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos());

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('no envia parametros vacios', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos({
      codigo: '   ',
      nombre: '',
    }));

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('elimina espacios exteriores de codigo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ codigo: '  2026-1  ' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('codigo')).toBe('2026-1');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('elimina espacios exteriores de nombre', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ nombre: '  Primer periodo  ' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('nombre')).toBe('Primer periodo');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('envia estado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ estado: 'matricula_abierta' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('estado')).toBe('matricula_abierta');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('envia anio', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ anio: 2026 }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('anio')).toBe('2026');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte fechaInicio en fecha_inicio', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ fechaInicio: '2026-01-05' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('fecha_inicio')).toBe('2026-01-05');
    expect(solicitud.request.params.has('fechaInicio')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte fechaFin en fecha_fin', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ fechaFin: '2026-06-30' }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('fecha_fin')).toBe('2026-06-30');
    expect(solicitud.request.params.has('fechaFin')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte pagina en page', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ pagina: 2 }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.has('pagina')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('convierte limite en limit', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarPeriodos({ limite: 25 }),
    );

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('limit')).toBe('25');
    expect(solicitud.request.params.has('limite')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('envia todos los filtros juntos', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos({
      codigo: '2026-1',
      nombre: 'Primer periodo',
      estado: 'planificado',
      anio: 2026,
      fechaInicio: '2026-01-05',
      fechaFin: '2026-06-30',
      pagina: 2,
      limite: 10,
    }));

    const solicitud = controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.params.get('codigo')).toBe('2026-1');
    expect(solicitud.request.params.get('nombre')).toBe('Primer periodo');
    expect(solicitud.request.params.get('estado')).toBe('planificado');
    expect(solicitud.request.params.get('anio')).toBe('2026');
    expect(solicitud.request.params.get('fecha_inicio')).toBe('2026-01-05');
    expect(solicitud.request.params.get('fecha_fin')).toBe('2026-06-30');
    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('10');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('no modifica el objeto recibido', async () => {
    const filtros: FiltrosListadoPeriodos = {
      codigo: '  2026-1  ',
      nombre: '  Primer periodo  ',
      estado: 'planificado',
      anio: 2026,
      fechaInicio: '2026-01-05',
      fechaFin: '2026-06-30',
      pagina: 1,
      limite: 10,
    };
    const filtrosOriginales = { ...filtros };

    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos(filtros));
    controladorHttp.expectOne(
      (peticion) => peticion.url === obtenerUrlApi('periodos-academicos'),
    ).flush(crearRespuestaListado());
    await promesaRespuesta;

    expect(filtros).toEqual(filtrosOriginales);
  });

  it('conserva la respuesta paginada', async () => {
    const respuesta = crearRespuestaListado({
      page: 2,
      limit: 20,
      total: 25,
      totalPages: 2,
    });
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos());

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos'))
      .flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('conserva los estados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos());

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos')).flush(
      crearRespuestaListado({
        data: [
          crearPeriodo({ estado: 'planificado' }),
          crearPeriodo({ id: 2, estado: 'matricula_abierta' }),
          crearPeriodo({ id: 3, estado: 'en_curso' }),
          crearPeriodo({ id: 4, estado: 'cerrado' }),
        ],
      }),
    );

    const respuesta = await promesaRespuesta;

    expect(respuesta.data?.map((periodo) => periodo.estado)).toEqual([
      'planificado',
      'matricula_abierta',
      'en_curso',
      'cerrado',
    ]);
  });

  it.each([400, 403, 429, 500])(
    'propaga error %s',
    async (estadoHttp) => {
      const promesaRespuesta = firstValueFrom(servicio.listarPeriodos());

      controladorHttp
        .expectOne(obtenerUrlApi('periodos-academicos'))
        .flush({}, { status: estadoHttp, statusText: 'Error' });

      await expect(promesaRespuesta).rejects.toBeTruthy();
    },
  );

  it('no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos());

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarPeriodos());

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos'))
      .flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('crearPeriodo ejecuta POST periodos academicos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.method).toBe('POST');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo utiliza metodo POST', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.method).toBe('POST');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo envia codigo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo({ codigo: '2027-1' })),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body.codigo).toBe('2027-1');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo envia nombre', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo({
        nombre: 'Primer periodo 2027',
      })),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body.nombre).toBe('Primer periodo 2027');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo envia fecha_inicio', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo({
        fecha_inicio: '2027-01-01',
      })),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body.fecha_inicio).toBe('2027-01-01');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo envia fecha_fin', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo({
        fecha_fin: '2027-06-30',
      })),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body.fecha_fin).toBe('2027-06-30');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo envia fecha_inicio_matricula', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo({
        fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
      })),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body.fecha_inicio_matricula)
      .toBe('2027-01-01T08:00:00.000Z');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo envia fecha_fin_matricula', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo({
        fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
      })),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body.fecha_fin_matricula)
      .toBe('2027-01-31T23:00:00.000Z');
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo no envia estado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect('estado' in solicitud.request.body).toBe(false);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo no envia propiedades adicionales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(Object.keys(solicitud.request.body)).toEqual([
      'codigo',
      'nombre',
      'fecha_inicio',
      'fecha_fin',
      'fecha_inicio_matricula',
      'fecha_fin_matricula',
    ]);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo no modifica la solicitud', async () => {
    const solicitudPeriodo = crearSolicitudPeriodo({
      codigo: '  2027-1  ',
      nombre: '  Primer   periodo 2027  ',
    });
    const solicitudOriginal = { ...solicitudPeriodo };
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(solicitudPeriodo),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos'))
      .flush(crearRespuestaPeriodo());
    await promesaRespuesta;

    expect(solicitudPeriodo).toEqual(solicitudOriginal);
  });

  it('crearPeriodo no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo conserva las fechas exactamente', async () => {
    const solicitudPeriodo = crearSolicitudPeriodo({
      fecha_inicio: '2027-01-01',
      fecha_fin: '2027-06-30',
      fecha_inicio_matricula: '2027-01-01T08:30:00.000Z',
      fecha_fin_matricula: '2027-01-31T23:45:00.000Z',
    });
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(solicitudPeriodo),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos'),
    );

    expect(solicitud.request.body).toEqual(solicitudPeriodo);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('crearPeriodo devuelve el periodo creado', async () => {
    const periodo = crearPeriodo({ id: 15, codigo: '2027-1' });
    const respuesta = crearRespuestaPeriodo(periodo);
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos'))
      .flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('crearPeriodo conserva estado planificado de la respuesta', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos')).flush(
      crearRespuestaPeriodo(crearPeriodo({ estado: 'planificado' })),
    );

    const respuesta = await promesaRespuesta;

    expect(respuesta.data?.estado).toBe('planificado');
  });

  it.each([400, 403, 409, 429, 500])(
    'crearPeriodo propaga error %s',
    async (estadoHttp) => {
      const promesaRespuesta = firstValueFrom(
        servicio.crearPeriodo(crearSolicitudPeriodo()),
      );

      controladorHttp
        .expectOne(obtenerUrlApi('periodos-academicos'))
        .flush({}, { status: estadoHttp, statusText: 'Error' });

      await expect(promesaRespuesta).rejects.toBeTruthy();
    },
  );

  it('crearPeriodo no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.crearPeriodo(crearSolicitudPeriodo()),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos'))
      .flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('obtenerPeriodoPorId ejecuta GET periodo academico por id', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaPeriodo(crearPeriodo({ id: 15 })));
    await promesaRespuesta;
  });

  it('obtenerPeriodoPorId no agrega parametros', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('obtenerPeriodoPorId devuelve el periodo', async () => {
    const periodo = crearPeriodo({ id: 15, codigo: '2027-1' });
    const respuesta = crearRespuestaPeriodo(periodo);
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15'))
      .flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it('obtenerPeriodoPorId conserva sus fechas', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15')).flush(
      crearRespuestaPeriodo(crearPeriodo({
        fecha_inicio: '2027-01-01',
        fecha_fin: '2027-06-30',
        fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
        fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
      })),
    );

    const respuesta = await promesaRespuesta;

    expect(respuesta.data?.fecha_inicio).toBe('2027-01-01');
    expect(respuesta.data?.fecha_fin).toBe('2027-06-30');
    expect(respuesta.data?.fecha_inicio_matricula)
      .toBe('2027-01-01T08:00:00.000Z');
    expect(respuesta.data?.fecha_fin_matricula)
      .toBe('2027-01-31T23:00:00.000Z');
  });

  it('obtenerPeriodoPorId conserva el estado', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15')).flush(
      crearRespuestaPeriodo(crearPeriodo({ estado: 'en_curso' })),
    );

    const respuesta = await promesaRespuesta;

    expect(respuesta.data?.estado).toBe('en_curso');
  });

  it('obtenerPeriodoPorId tolera cursos en la respuesta', async () => {
    type PeriodoConCursos = PeriodoAcademico & { cursos: [] };
    const periodo: PeriodoConCursos = {
      ...crearPeriodo({ id: 15 }),
      cursos: [],
    };
    const respuesta: RespuestaPeriodoAcademico & { data: PeriodoConCursos } = {
      success: true,
      data: periodo,
    };
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15'))
      .flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it.each([403, 404])(
    'obtenerPeriodoPorId propaga error %s',
    async (estadoHttp) => {
      const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

      controladorHttp
        .expectOne(obtenerUrlApi('periodos-academicos/15'))
        .flush({}, { status: estadoHttp, statusText: 'Error' });

      await expect(promesaRespuesta).rejects.toBeTruthy();
    },
  );

  it('obtenerPeriodoPorId no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('obtenerPeriodoPorId no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerPeriodoPorId(15));

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15'))
      .flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo ejecuta PUT periodo academico por id', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, crearSolicitudActualizacion()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.method).toBe('PUT');
    solicitud.flush(crearRespuestaPeriodo(crearPeriodo({ id: 15 })));
    await promesaRespuesta;
  });

  it('actualizarPeriodo envia solamente nombre', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, { nombre: 'Periodo actualizado' }),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.body).toEqual({ nombre: 'Periodo actualizado' });
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo envia solamente codigo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, { codigo: '2027-2' }),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.body).toEqual({ codigo: '2027-2' });
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo envia solamente una fecha modificada', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, { fecha_inicio: '2027-01-02' }),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.body).toEqual({ fecha_inicio: '2027-01-02' });
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo envia todos los campos editables juntos', async () => {
    const solicitudActualizacion = crearSolicitudActualizacion();
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, solicitudActualizacion),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.body).toEqual(solicitudActualizacion);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it.each([
    'estado',
    'id',
    'created_at',
    'updated_at',
    'cursos',
  ])('actualizarPeriodo no envia %s', async (propiedad) => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, crearSolicitudActualizacion()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(propiedad in solicitud.request.body).toBe(false);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo conserva fechas ISO exactamente', async () => {
    const solicitudActualizacion = crearSolicitudActualizacion({
      fecha_inicio_matricula: '2027-01-01T08:30:00.000Z',
      fecha_fin_matricula: '2027-01-31T23:45:00.000Z',
    });
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, solicitudActualizacion),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.body).toEqual(solicitudActualizacion);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo no modifica la solicitud recibida', async () => {
    const solicitudActualizacion = crearSolicitudActualizacion({
      codigo: '  2027-2  ',
      nombre: '  Periodo   actualizado  ',
    });
    const solicitudOriginal = { ...solicitudActualizacion };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, solicitudActualizacion),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15'))
      .flush(crearRespuestaPeriodo());
    await promesaRespuesta;

    expect(solicitudActualizacion).toEqual(solicitudOriginal);
  });

  it('actualizarPeriodo devuelve el periodo actualizado', async () => {
    const periodo = crearPeriodo({
      id: 15,
      nombre: 'Primer periodo 2027 actualizado',
    });
    const respuesta = crearRespuestaPeriodo(periodo);
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, { nombre: periodo.nombre }),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15'))
      .flush(respuesta);

    await expect(promesaRespuesta).resolves.toEqual(respuesta);
  });

  it.each([400, 403, 404, 409, 429, 500])(
    'actualizarPeriodo propaga error %s',
    async (estadoHttp) => {
      const promesaRespuesta = firstValueFrom(
        servicio.actualizarPeriodo(15, crearSolicitudActualizacion()),
      );

      controladorHttp
        .expectOne(obtenerUrlApi('periodos-academicos/15'))
        .flush({}, { status: estadoHttp, statusText: 'Error' });

      await expect(promesaRespuesta).rejects.toBeTruthy();
    },
  );

  it('actualizarPeriodo no agrega Authorization manualmente', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, crearSolicitudActualizacion()),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('periodos-academicos/15'),
    );

    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    solicitud.flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });

  it('actualizarPeriodo no realiza solicitudes adicionales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarPeriodo(15, crearSolicitudActualizacion()),
    );

    controladorHttp.expectOne(obtenerUrlApi('periodos-academicos/15'))
      .flush(crearRespuestaPeriodo());
    await promesaRespuesta;
  });
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

function crearSolicitudPeriodo(
  parcial: Partial<CrearPeriodoAcademicoSolicitud> = {},
): CrearPeriodoAcademicoSolicitud {
  return {
    codigo: '2027-1',
    nombre: 'Primer periodo 2027',
    fecha_inicio: '2027-01-01',
    fecha_fin: '2027-06-30',
    fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
    fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
    ...parcial,
  };
}

function crearSolicitudActualizacion(
  parcial: Partial<ActualizarPeriodoAcademicoSolicitud> = {},
): ActualizarPeriodoAcademicoSolicitud {
  return {
    codigo: '2027-1',
    nombre: 'Primer periodo 2027 actualizado',
    fecha_inicio: '2027-01-01',
    fecha_fin: '2027-06-30',
    fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
    fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
    ...parcial,
  };
}

function crearRespuestaPeriodo(
  periodo = crearPeriodo({
    codigo: '2027-1',
    nombre: 'Primer periodo 2027',
    fecha_inicio: '2027-01-01',
    fecha_fin: '2027-06-30',
    fecha_inicio_matricula: '2027-01-01T08:00:00.000Z',
    fecha_fin_matricula: '2027-01-31T23:00:00.000Z',
    estado: 'planificado',
  }),
): RespuestaPeriodoAcademico {
  return {
    success: true,
    message: 'Periodo academico creado correctamente.',
    data: periodo,
  };
}
