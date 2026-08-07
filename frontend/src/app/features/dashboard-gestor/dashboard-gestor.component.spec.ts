import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import type {
  RespuestaResumenMatriculas,
  ResumenMatriculas,
} from '../matriculas/models/matricula.model';
import { ESTADOS_MATRICULA } from '../matriculas/models/matricula.model';
import { MatriculasService } from '../matriculas/services/matriculas.service';
import { DashboardGestorComponent } from './dashboard-gestor.component';

interface MatriculasServiceMock {
  obtenerResumenMatriculas: ReturnType<
    typeof vi.fn<() => Observable<RespuestaResumenMatriculas>>
  >;
}

describe('DashboardGestorComponent', () => {
  let fixture: ComponentFixture<DashboardGestorComponent>;
  let componente: DashboardGestorComponent;
  let matriculasService: MatriculasServiceMock;

  beforeEach(async () => {
    matriculasService = {
      obtenerResumenMatriculas: vi.fn(() =>
        respuestaObservable(crearRespuestaResumen()),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardGestorComponent],
      providers: [
        provideRouter([]),
        {
          provide: MatriculasService,
          useValue: matriculasService,
        },
      ],
    }).compileComponents();
  });

  it('consulta el resumen de matrículas al iniciar', () => {
    crearComponente();

    expect(matriculasService.obtenerResumenMatriculas).toHaveBeenCalledTimes(1);
  });

  it('muestra el periodo actual y la ventana abierta', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Periodo 2026-1');
    expect(obtenerTexto()).toContain('Ventana abierta');
  });

  it('muestra las tarjetas del resumen', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Matrículas hoy');
    expect(obtenerTexto()).toContain('Estudiantes en el periodo');
  });

  it('muestra cursos con pocos cupos y cursos llenos', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Cursos con pocos cupos');
    expect(obtenerTexto()).toContain('MAT101 - Matemática I (A)');
    expect(obtenerTexto()).toContain('Cursos llenos');
    expect(obtenerTexto()).toContain('FIS101 - Física I (B)');
  });

  it('muestra las últimas matrículas', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Últimas matrículas');
    expect(obtenerTexto()).toContain('Ana Vera');
  });

  it('indica cuando la ventana está cerrada', () => {
    matriculasService.obtenerResumenMatriculas.mockReturnValueOnce(
      respuestaObservable(
        crearRespuestaResumen({
          ventana_matricula_abierta: false,
        }),
      ),
    );

    crearComponente();

    expect(obtenerTexto()).toContain('Ventana cerrada');
  });

  it('muestra error de API', () => {
    matriculasService.obtenerResumenMatriculas.mockReturnValueOnce(
      errorObservable(new HttpErrorResponse({ status: 0 })),
    );

    crearComponente();

    expect(obtenerTexto()).toContain(
      'No fue posible conectar con el servidor.',
    );
  });

  it('al actualizar consulta nuevamente el resumen', () => {
    crearComponente();
    matriculasService.obtenerResumenMatriculas.mockClear();

    componente.cargarResumen();

    expect(matriculasService.obtenerResumenMatriculas).toHaveBeenCalledTimes(1);
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(DashboardGestorComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function respuestaObservable<T>(valor: T): Observable<T> {
  return new Observable<T>((suscriptor) => {
    suscriptor.next(valor);
    suscriptor.complete();
  });
}

function errorObservable(error: unknown): Observable<never> {
  return new Observable<never>((suscriptor) => {
    suscriptor.error(error);
  });
}

function crearRespuestaResumen(
  cambios: Partial<ResumenMatriculas> = {},
): RespuestaResumenMatriculas {
  return {
    success: true,
    data: {
      periodo_actual: {
        id: 3,
        codigo: '2026-1',
        nombre: 'Periodo 2026-1',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-06-30',
        fecha_inicio_matricula: '2025-12-01',
        fecha_fin_matricula: '2026-01-31',
        estado: 'matricula_abierta',
      },
      ventana_matricula_abierta: true,
      matriculas_registradas_hoy: 5,
      estudiantes_matriculados_periodo: 120,
      cursos_con_pocos_cupos: [
        {
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
        },
      ],
      cursos_llenos: [
        {
          id: 8,
          periodo_id: 3,
          asignatura_id: 6,
          docente_id: 4,
          paralelo: 'B',
          aula: 'Aula 202',
          horario: 'Martes 10:00-12:00',
          cupo_maximo: 25,
          estado: 'lleno',
          asignatura: {
            id: 6,
            codigo: 'FIS101',
            nombre: 'Física I',
            creditos: 4,
            nivel_academico: 1,
            activo: true,
          },
        },
      ],
      ultimas_matriculas: [
        {
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
          },
        },
      ],
      ...cambios,
    },
  };
}
