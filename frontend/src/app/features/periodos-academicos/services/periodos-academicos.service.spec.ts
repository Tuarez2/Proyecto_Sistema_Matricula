import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  FiltrosListadoPeriodos,
  PeriodoAcademico,
  RespuestaListadoPeriodos,
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
