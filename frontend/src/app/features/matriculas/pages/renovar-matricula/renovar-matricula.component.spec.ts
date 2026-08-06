import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import { type Estudiante } from '../../../estudiantes/models/estudiante.model';
import { EstudiantesService } from '../../../estudiantes/services/estudiantes.service';
import { type PeriodoAcademico } from '../../../periodos-academicos/models/periodo-academico.model';
import { PeriodosAcademicosService } from '../../../periodos-academicos/services/periodos-academicos.service';
import type {
  CursoDisponibleMatricula,
  Matricula,
  RespuestaCursosDisponibles,
  RespuestaListadoMatriculas,
} from '../../models/matricula.model';
import { MatriculasService } from '../../services/matriculas.service';
import { RenovarMatriculaComponent } from './renovar-matricula.component';

describe('RenovarMatriculaComponent', () => {
  let fixture: ComponentFixture<RenovarMatriculaComponent>;
  let estudiantesService: EstudiantesServiceMock;
  let matriculasService: MatriculasServiceMock;
  let periodosService: PeriodosServiceMock;

  beforeEach(async () => {
    estudiantesService = {
      listarEstudiantes: vi.fn(() => respuestaObservable({ success: true, data: [crearEstudiante()] })),
      obtenerCursosDisponibles: vi.fn(() =>
        respuestaObservable(crearRespuestaCursosDisponibles()),
      ),
    };
    matriculasService = {
      listarMatriculas: vi.fn(() =>
        respuestaObservable(crearRespuestaMatriculasAnteriores()),
      ),
      crearMatriculasLote: vi.fn(() => respuestaObservable(crearRespuestaLote())),
    };
    periodosService = {
      listarPeriodos: vi.fn(() =>
        respuestaObservable({ success: true, data: crearPeriodos() }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [RenovarMatriculaComponent],
      providers: [
        provideRouter([]),
        { provide: EstudiantesService, useValue: estudiantesService },
        { provide: MatriculasService, useValue: matriculasService },
        { provide: PeriodosAcademicosService, useValue: periodosService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RenovarMatriculaComponent);
    fixture.detectChanges();
  });

  it('consulta las matrículas del periodo anterior como referencia de asignaturas', () => {
    avanzarHastaRevision();

    expect(matriculasService.listarMatriculas).toHaveBeenCalledWith({
      estudiante_id: 5,
      periodo_id: 1,
      limit: 100,
    });
  });

  it('preselecciona la única oferta disponible de una asignatura', () => {
    avanzarHastaRevision();

    const cursos = fixture.nativeElement.querySelectorAll(
      '.renovar-matricula__item--seleccionable',
    );
    const cursoUnico = cursos[0] as HTMLElement;

    expect(cursoUnico.textContent ?? '').toContain('MAT101 - Matemática I');
    expect((cursoUnico.querySelector('input') as HTMLInputElement).checked).toBe(true);
  });

  it('no preselecciona ninguno cuando existen varios paralelos de la asignatura', () => {
    avanzarHastaRevision();

    const cursos = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.renovar-matricula__item--seleccionable input',
      ),
    ) as HTMLInputElement[];
    const paralelos = cursos.filter((input) => {
      const contenedor = input.closest('.renovar-matricula__item');

      return contenedor?.textContent?.includes('Física') ?? false;
    });

    expect(paralelos).toHaveLength(2);
    expect(paralelos.every((input) => input.checked)).toBe(false);
  });

  it('informa las asignaturas sin oferta en el periodo nuevo', () => {
    avanzarHastaRevision();

    expect(obtenerTexto()).toContain('Sin oferta para esta asignatura');
    expect(obtenerTexto()).toContain('Química General');
  });

  it('permite quitar cursos preseleccionados', () => {
    avanzarHastaRevision();

    const casillaUnica = fixture.nativeElement.querySelector(
      '.renovar-matricula__item--seleccionable input',
    ) as HTMLInputElement;

    casillaUnica.click();
    fixture.detectChanges();

    expect(casillaUnica.checked).toBe(false);
  });

  function avanzarHastaRevision(): void {
    const componente = fixture.componentInstance;

    componente.seleccionarEstudiante(crearEstudiante());
    fixture.detectChanges();
    componente.seleccionarPeriodo(crearPeriodos()[1]);
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

interface EstudiantesServiceMock {
  listarEstudiantes: ReturnType<
    typeof vi.fn<(filtros: unknown) => Observable<{ success: boolean; data: Estudiante[] }>>
  >;
  obtenerCursosDisponibles: ReturnType<
    typeof vi.fn<(idEstudiante: number, idPeriodo: number) => Observable<RespuestaCursosDisponibles>>
  >;
}

interface MatriculasServiceMock {
  listarMatriculas: ReturnType<
    typeof vi.fn<(filtros: unknown) => Observable<RespuestaListadoMatriculas>>
  >;
  crearMatriculasLote: ReturnType<
    typeof vi.fn<(solicitud: unknown) => Observable<{ success: boolean; data: unknown }>>
  >;
}

interface PeriodosServiceMock {
  listarPeriodos: ReturnType<
    typeof vi.fn<(filtros: unknown) => Observable<{ success: boolean; data: PeriodoAcademico[] }>>
  >;
}

function respuestaObservable<T>(valor: T): Observable<T> {
  return new Observable<T>((suscriptor) => {
    suscriptor.next(valor);
    suscriptor.complete();
  });
}

function crearEstudiante(): Estudiante {
  return {
    id: 5,
    carrera_id: 9,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: null,
    fecha_nacimiento: '2000-01-01',
    estado_academico: 'activo',
    nivel_academico_actual: 3,
  };
}

function crearPeriodos(): PeriodoAcademico[] {
  return [
    {
      id: 1,
      codigo: '2026-1',
      nombre: 'Periodo 2026-1',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-06-30',
      fecha_inicio_matricula: '2025-12-01',
      fecha_fin_matricula: '2026-01-31',
      estado: 'matricula_abierta',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      codigo: '2026-2',
      nombre: 'Periodo 2026-2',
      fecha_inicio: '2026-07-01',
      fecha_fin: '2026-12-31',
      fecha_inicio_matricula: '2026-06-01',
      fecha_fin_matricula: '2026-07-31',
      estado: 'matricula_abierta',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];
}

function crearMatriculaAnterior(idMatricula: number, asignaturaId: number): Matricula {
  return {
    id: idMatricula,
    estudiante_id: 5,
    curso_id: idMatricula,
    fecha_matricula: '2026-01-15T10:00:00.000Z',
    estado: 'inscrita',
    calificacion_final: null,
    curso: {
      id: idMatricula,
      periodo_id: 1,
      asignatura_id: asignaturaId,
      docente_id: 4,
      paralelo: 'A',
      aula: 'Aula 101',
      horario: 'Lunes 08:00-10:00',
      cupo_maximo: 30,
      estado: 'abierto',
      asignatura: crearAsignatura(asignaturaId),
    },
  };
}

function crearAsignatura(asignaturaId: number): {
  id: number;
  codigo: string;
  nombre: string;
  creditos: number;
  nivel_academico: number;
  activo: boolean;
} {
  const asignaturas: Record<
    number,
    { codigo: string; nombre: string }
  > = {
    10: { codigo: 'MAT101', nombre: 'Matemática I' },
    11: { codigo: 'FIS101', nombre: 'Física I' },
    12: { codigo: 'QUI101', nombre: 'Química General' },
  };
  const datos = asignaturas[asignaturaId] ?? { codigo: `AS-${asignaturaId}`, nombre: 'Asignatura' };

  return {
    id: asignaturaId,
    codigo: datos.codigo,
    nombre: datos.nombre,
    creditos: 4,
    nivel_academico: 1,
    activo: true,
  };
}

function crearRespuestaMatriculasAnteriores(): RespuestaListadoMatriculas {
  return {
    success: true,
    data: [
      crearMatriculaAnterior(100, 10),
      crearMatriculaAnterior(101, 11),
      crearMatriculaAnterior(102, 12),
    ],
    page: 1,
    limit: 100,
    total: 3,
    totalPages: 1,
  };
}

function crearRespuestaCursosDisponibles(): RespuestaCursosDisponibles {
  return {
    success: true,
    data: {
      estudiante_id: 5,
      periodo: { id: 2, codigo: '2026-2', nombre: 'Periodo 2026-2', estado: 'matricula_abierta' },
      cursos: [
        crearCursoDisponible(200, 10, 'A', 25),
        crearCursoDisponible(201, 11, 'A', 20),
        crearCursoDisponible(202, 11, 'B', 22),
      ],
    },
  };
}

function crearCursoDisponible(
  idCurso: number,
  asignaturaId: number,
  paralelo: string,
  cuposDisponibles: number,
): CursoDisponibleMatricula {
  return {
    id: idCurso,
    periodo_id: 2,
    asignatura_id: asignaturaId,
    docente_id: 4,
    paralelo,
    aula: 'Aula 101',
    horario: `Lunes 08:00-10:00 (${paralelo})`,
    cupo_maximo: 30,
    estado: 'abierto',
    cantidad_matriculados: 30 - cuposDisponibles,
    cupos_disponibles: cuposDisponibles,
    disponible: cuposDisponibles > 0,
    asignatura: crearAsignatura(asignaturaId),
  };
}

function crearRespuestaLote(): { success: boolean; data: unknown } {
  return {
    success: true,
    data: null,
  };
}
