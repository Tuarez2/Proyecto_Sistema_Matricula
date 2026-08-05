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

  it('listarEstudiantes ejecuta GET contra la API real configurada', async () => {
    const promesaRespuesta = firstValueFrom(servicio.listarEstudiantes());

    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.keys()).toEqual([]);
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

  it('getEstudiantes mantiene compatibilidad y filtra por estado legado', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.getEstudiantes({ estado: 'ACTIVO' }),
    );
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    solicitud.flush(crearRespuestaListado([
      crearEstudiante({ id: 1, estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO }),
      crearEstudiante({ id: 2, estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.INACTIVO }),
    ]));

    await expect(promesaRespuesta).resolves.toEqual([
      expect.objectContaining({ id: 1 }),
    ]);
  });

  it('getEstudiantes filtra localmente por busqueda y carrera', async () => {
    const promesaRespuesta = firstValueFrom(
      servicio.getEstudiantes({ busqueda: 'ana', carreraId: 2 }),
    );
    const solicitud = controladorHttp.expectOne(obtenerUrlApi('estudiantes'));

    solicitud.flush(crearRespuestaListado([
      crearEstudiante({ id: 1, nombres: 'Ana', carrera_id: 2 }),
      crearEstudiante({ id: 2, nombres: 'Ana', carrera_id: 3 }),
      crearEstudiante({
        id: 3,
        nombres: 'Luis',
        carrera_id: 2,
        correo: 'luis.vera@universidad.edu',
      }),
    ]));

    await expect(promesaRespuesta).resolves.toEqual([
      expect.objectContaining({ id: 1 }),
    ]);
  });
});

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
