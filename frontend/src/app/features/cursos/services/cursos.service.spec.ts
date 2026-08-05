import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import type {
  Curso,
  RespuestaCurso,
  SolicitudCrearCurso,
} from '../models/curso.model';
import { CursosService } from './cursos.service';

describe('CursosService', () => {
  let servicio: CursosService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(CursosService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listar consulta la API real con los filtros admitidos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listar({
        periodo_id: 10,
        asignatura_id: 100,
        docente_id: 1000,
        estado: 'abierto',
        paralelo: 'A',
        pagina: 2,
        limite: 10,
      }),
    );

    const solicitud = controladorHttp.expectOne(
      (solicitudHttp) =>
        solicitudHttp.url === obtenerUrlApi('cursos') &&
        solicitudHttp.method === 'GET',
    );

    expect(solicitud.request.params.get('periodo_id')).toBe('10');
    expect(solicitud.request.params.get('asignatura_id')).toBe('100');
    expect(solicitud.request.params.get('docente_id')).toBe('1000');
    expect(solicitud.request.params.get('estado')).toBe('abierto');
    expect(solicitud.request.params.get('paralelo')).toBe('A');
    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('10');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listar sin filtros no envía parámetros inventados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listar());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listar omite filtros vacíos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listar({ paralelo: '   ', estado: undefined }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerCurso consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerCurso(7));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos/7'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaCurso());
    await promesaRespuesta;
  });

  it('crearCurso envía el payload exacto sin relaciones ficticias', async () => {
    const solicitudCrear: SolicitudCrearCurso = {
      periodo_id: 10,
      asignatura_id: 100,
      docente_id: 1000,
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00',
      cupo_maximo: 40,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.crearCurso(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    expect(solicitud.request.body).not.toHaveProperty('asignatura');
    expect(solicitud.request.body).not.toHaveProperty('docente');
    expect(solicitud.request.body).not.toHaveProperty('periodoAcademico');
    solicitud.flush(crearRespuestaCurso());
    await promesaRespuesta;
  });

  it('actualizarCurso ejecuta PUT con los campos editables', async () => {
    const cuerpo = {
      aula: 'Aula 201',
      horario: 'Viernes 10:00',
    };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarCurso(7, cuerpo),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos/7'));

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaCurso(cuerpo));
    await promesaRespuesta;
  });

  it('cancelarCurso usa DELETE porque el backend implementa la baja lógica', async () => {
    const promesaRespuesta = firstValueFrom(servicio.cancelarCurso(7));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos/7'));

    expect(solicitud.request.method).toBe('DELETE');
    expect(solicitud.request.body).toBeNull();
    solicitud.flush(crearRespuestaCurso({ estado: 'cancelado' }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listar());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('cursos'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function crearCurso(cambios: Partial<Curso> = {}): Curso {
  return {
    id: 7,
    periodo_id: 10,
    asignatura_id: 100,
    docente_id: 1000,
    paralelo: 'A',
    aula: 'Aula 101',
    horario: 'Lunes 08:00',
    cupo_maximo: 40,
    estado: 'abierto',
    cantidad_matriculados: 5,
    cupos_disponibles: 35,
    periodoAcademico: {
      id: 10,
      codigo: '2026-1',
      nombre: 'Primer Semestre 2026',
      fecha_inicio: '2026-03-01',
      fecha_fin: '2026-07-31',
      fecha_inicio_matricula: '2026-02-15',
      fecha_fin_matricula: '2026-03-05',
      estado: 'planificado',
    },
    asignatura: {
      id: 100,
      codigo: 'PRG1',
      nombre: 'Programación I',
      creditos: 4,
      nivel_academico: 1,
      activo: true,
    },
    docente: {
      id: 1000,
      identificacion: '0102030405',
      nombres: 'Ana',
      apellidos: 'Gómez',
      correo: 'ana.gomez@universidad.edu',
      especialidad: 'Software',
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaListado(
  cursos: Curso[] = [crearCurso()],
) {
  return {
    success: true as const,
    data: cursos,
    page: 1,
    limit: 10,
    total: cursos.length,
    totalPages: 1,
  };
}

function crearRespuestaCurso(
  cambios: Partial<Curso> = {},
): RespuestaCurso {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearCurso(cambios),
  };
}
