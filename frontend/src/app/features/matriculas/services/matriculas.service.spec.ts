import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import {
  ESTADOS_MATRICULA,
  type Matricula,
  type RespuestaListadoMatriculas,
  type RespuestaMatricula,
  type SolicitudCrearMatricula,
} from '../models/matricula.model';
import { MatriculasService } from './matriculas.service';

describe('MatriculasService', () => {
  let servicio: MatriculasService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(MatriculasService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listarMatriculas ejecuta GET contra la API real configurada', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarMatriculas());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('matriculas'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarMatriculas envia filtros y paginacion con nombres reales', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarMatriculas({
        estudiante_id: 2,
        curso_id: 7,
        periodo_id: 3,
        asignatura_id: 5,
        carrera_id: 9,
        estado: ESTADOS_MATRICULA.inscrita,
        fecha_desde: '2026-01-01',
        fecha_hasta: '2026-01-31',
        page: 2,
        limit: 20,
      }),
    );

    const solicitud = controladorHttp.expectOne((peticion) =>
      peticion.url === obtenerUrlApi('matriculas'),
    );

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('estudiante_id')).toBe('2');
    expect(solicitud.request.params.get('curso_id')).toBe('7');
    expect(solicitud.request.params.get('periodo_id')).toBe('3');
    expect(solicitud.request.params.get('asignatura_id')).toBe('5');
    expect(solicitud.request.params.get('carrera_id')).toBe('9');
    expect(solicitud.request.params.get('estado')).toBe('inscrita');
    expect(solicitud.request.params.get('fecha_desde')).toBe('2026-01-01');
    expect(solicitud.request.params.get('fecha_hasta')).toBe('2026-01-31');
    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('20');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarMatriculas no envia filtros vacios o invalidos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarMatriculas({
        estudiante_id: 0,
        estado: undefined,
        fecha_desde: '   ',
        page: -1,
      }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('matriculas'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerMatricula consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerMatricula(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('matriculas/15'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaMatricula());
    await promesaRespuesta;
  });

  it('crearMatricula envia el payload real del backend', async () => {
    const solicitudCrear: SolicitudCrearMatricula = {
      estudiante_id: 2,
      curso_id: 7,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.crearMatricula(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('matriculas'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    solicitud.flush(crearRespuestaMatricula());
    await promesaRespuesta;
  });

  it('cambiarEstadoMatricula ejecuta PATCH con el estado permitido', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.cambiarEstadoMatricula(15, {
        estado: ESTADOS_MATRICULA.retirada,
      }),
    );

    const solicitud = controladorHttp.expectOne(
      obtenerUrlApi('matriculas/15/estado'),
    );

    expect(solicitud.request.method).toBe('PATCH');
    expect(solicitud.request.body).toEqual({ estado: 'retirada' });
    solicitud.flush(crearRespuestaMatricula({
      estado: ESTADOS_MATRICULA.retirada,
    }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarMatriculas());
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('matriculas'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function crearMatricula(cambios: Partial<Matricula> = {}): Matricula {
  return {
    id: 15,
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
      carrera: {
        id: 9,
        codigo: 'SIS',
        nombre: 'Ingeniería de Software',
        duracion_semestres: 8,
        facultad_id: 1,
        activo: true,
      },
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

function crearRespuestaMatricula(
  cambios: Partial<Matricula> = {},
): RespuestaMatricula {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearMatricula(cambios),
  };
}
