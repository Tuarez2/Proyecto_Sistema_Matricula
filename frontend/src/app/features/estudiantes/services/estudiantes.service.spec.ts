import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { obtenerUrlApi } from '../../../core/config/configuracion-api';
import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type Estudiante,
  type RespuestaEstudiante,
  type RespuestaListadoEstudiantes,
  type SolicitudCrearEstudiante,
} from '../models/estudiante.model';
import { EstudiantesService } from './estudiantes.service';

describe('EstudiantesService', () => {
  let servicio: EstudiantesService;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(EstudiantesService);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('listarEstudiantes ejecuta GET contra la URL centralizada sin parámetros inventados', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarEstudiantes());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía page y limit', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ pagina: 2, limite: 25 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('25');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de número de matrícula', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ numero_matricula: 'EST-2026' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('numero_matricula')).toBe('EST-2026');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de identificación', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ identificacion: '1002003004' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('identificacion')).toBe('1002003004');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de nombres', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ nombres: 'Ana' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('nombres')).toBe('Ana');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de apellidos', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ apellidos: 'Vera' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('apellidos')).toBe('Vera');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de correo', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ correo: 'ana.vera' }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('correo')).toBe('ana.vera');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de carrera como carrera_id', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ carrera_id: 2 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('carrera_id')).toBe('2');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de estado académico', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({
        estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
      }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('estado_academico')).toBe('activo');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes envía el filtro de nivel académico actual', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({ nivel_academico_actual: 3 }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('nivel_academico_actual')).toBe('3');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes omite filtros vacíos y undefined', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({
        numero_matricula: '   ',
        identificacion: undefined,
        nombres: undefined,
        apellidos: undefined,
        correo: undefined,
        carrera_id: undefined,
        estado_academico: undefined,
        nivel_academico_actual: undefined,
        pagina: undefined,
        limite: undefined,
      }),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    expect(solicitud.request.params.keys()).toEqual([]);
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('listarEstudiantes combina filtros y paginación en una sola solicitud', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.listarEstudiantes({
        numero_matricula: 'EST',
        identificacion: '100200',
        nombres: 'Ana',
        apellidos: 'Vera',
        correo: 'ana',
        carrera_id: 2,
        estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.SUSPENDIDO,
        nivel_academico_actual: 3,
        pagina: 2,
        limite: 50,
      }),
    );

    const solicitud = controladorHttp.expectOne(esperarSolicitudListado);

    expect(solicitud.request.params.get('numero_matricula')).toBe('EST');
    expect(solicitud.request.params.get('identificacion')).toBe('100200');
    expect(solicitud.request.params.get('nombres')).toBe('Ana');
    expect(solicitud.request.params.get('apellidos')).toBe('Vera');
    expect(solicitud.request.params.get('correo')).toBe('ana');
    expect(solicitud.request.params.get('carrera_id')).toBe('2');
    expect(solicitud.request.params.get('estado_academico')).toBe('suspendido');
    expect(solicitud.request.params.get('nivel_academico_actual')).toBe('3');
    expect(solicitud.request.params.get('page')).toBe('2');
    expect(solicitud.request.params.get('limit')).toBe('50');
    solicitud.flush(crearRespuestaListado());
    await promesaRespuesta;
  });

  it('obtenerEstudiante consulta por identificador', async () => {
    const promesaRespuesta = firstValueFrom(servicio.obtenerEstudiante(15));

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes/15'));

    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(crearRespuestaEstudiante());
    await promesaRespuesta;
  });

  it('crearEstudiante envia el payload real del backend', async () => {
    const solicitudCrear = crearSolicitudEstudiante();
    const promesaRespuesta = firstValueFrom(
      servicio.crearEstudiante(solicitudCrear),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual(solicitudCrear);
    solicitud.flush(crearRespuestaEstudiante());
    await promesaRespuesta;
  });

  it('actualizarEstudiante ejecuta PUT con campos permitidos', async () => {
    const cuerpo = {
      correo: 'actualizado@universidad.edu',
      telefono: null,
    };
    const promesaRespuesta = firstValueFrom(
      servicio.actualizarEstudiante(15, cuerpo),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes/15'));

    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual(cuerpo);
    solicitud.flush(crearRespuestaEstudiante());
    await promesaRespuesta;
  });

  it('cambiarEstadoEstudiante inactiva mediante DELETE', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.cambiarEstadoEstudiante(15),
    );

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes/15'));

    expect(solicitud.request.method).toBe('DELETE');
    solicitud.flush(crearRespuestaEstudiante({
      estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO,
    }));
    await promesaRespuesta;
  });

  it('propaga errores del backend', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarEstudiantes());
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    solicitud.flush(
      { success: false, message: 'No autorizado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promesaRespuesta).rejects.toMatchObject({ status: 403 });
  });
});

function esperarSolicitudListado(peticion: { url: string }): boolean {
  return peticion.url === obtenerUrlApi('estudiantes');
}

function crearSolicitudEstudiante(
  cambios: Partial<SolicitudCrearEstudiante> = {},
): SolicitudCrearEstudiante {
  return {
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
    ...cambios,
  };
}

function crearEstudiante(cambios: Partial<Estudiante> = {}): Estudiante {
  return {
    id: 15,
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
    carrera: {
      id: 2,
      codigo: 'SIS',
      nombre: 'Ingeniería de Software',
      duracion_semestres: 8,
      facultad_id: 1,
      activo: true,
    },
    ...cambios,
  };
}

function crearRespuestaListado(
  estudiantes: Estudiante[] = [crearEstudiante()],
): RespuestaListadoEstudiantes {
  return {
    success: true,
    data: estudiantes,
    page: 1,
    limit: 10,
    total: estudiantes.length,
    totalPages: Math.ceil(estudiantes.length / 10),
  };
}

function crearRespuestaEstudiante(
  cambios: Partial<Estudiante> = {},
): RespuestaEstudiante {
  return {
    success: true,
    message: 'Operación completada.',
    data: crearEstudiante(cambios),
  };
}
