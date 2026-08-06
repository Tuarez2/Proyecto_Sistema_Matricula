import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { CarrerasService } from '../../features/carreras/services/carreras.service';
import { CursosService } from '../../features/cursos/services/cursos.service';
import {
  ESTADOS_MATRICULA,
  type Matricula,
  type ResumenMatriculas,
} from '../../features/matriculas/models/matricula.model';
import { MatriculasService } from '../../features/matriculas/services/matriculas.service';

interface AvisoSistema {
  tipo: 'informativo' | 'urgente';
  mensaje: string;
}

const ETIQUETAS_ESTADO_MATRICULA: Readonly<Record<string, string>> =
  Object.freeze({
    [ESTADOS_MATRICULA.inscrita]: 'Inscrita',
    [ESTADOS_MATRICULA.aprobada]: 'Aprobada',
    [ESTADOS_MATRICULA.reprobada]: 'Reprobada',
    [ESTADOS_MATRICULA.retirada]: 'Retirada',
    [ESTADOS_MATRICULA.anulada]: 'Anulada',
  });

const ETIQUETAS_ESTADO_PERIODO: Readonly<Record<string, string>> =
  Object.freeze({
    planificado: 'Planificado',
    matricula_abierta: 'Matrículas Abiertas',
    en_curso: 'En Proceso',
    cerrado: 'Cerrado',
  });

const AVISOS_SISTEMA: readonly AvisoSistema[] = Object.freeze([
  {
    tipo: 'informativo',
    mensaje:
      'El proceso de matrícula extraordinaria inicia el 1 de septiembre.',
  },
  {
    tipo: 'informativo',
    mensaje:
      'Los estudiantes deben regularizar sus matrículas antes de la fecha límite del periodo vigente.',
  },
]);

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly matriculasService = inject(MatriculasService);
  private readonly carrerasService = inject(CarrerasService);
  private readonly cursosService = inject(CursosService);
  private readonly referenciaDestruccion = inject(DestroyRef);

  readonly esAdministrador = computed(
    () => this.autenticacionService.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly esGestorLecturaPersonas = computed(() => {
    const codigo = this.autenticacionService.usuarioActual?.()?.rol?.codigo;

    return codigo === CODIGOS_ROL.ADMIN || codigo === CODIGOS_ROL.GESTOR_MATRICULA;
  });

  readonly cargandoResumen = signal(true);
  readonly resumen = signal<ResumenMatriculas | null>(null);
  readonly totalCarrerasActivas = signal(0);
  readonly totalSolicitudesPendientes = signal(0);
  readonly cuposTotalesPeriodo = signal(0);
  readonly avisosSistema = AVISOS_SISTEMA;
  readonly ESTADOS_MATRICULA = ESTADOS_MATRICULA;

  readonly periodoActual = computed(
    () => this.resumen()?.periodo_actual ?? null,
  );
  readonly ventanaMatriculaAbierta = computed(
    () => this.resumen()?.ventana_matricula_abierta ?? false,
  );
  readonly estudiantesMatriculados = computed(
    () => this.resumen()?.estudiantes_matriculados_periodo ?? 0,
  );
  readonly ultimasMatriculas = computed(
    () => this.resumen()?.ultimas_matriculas ?? [],
  );
  readonly porcentajeCuposOcupados = computed(() => {
    const cuposTotales = this.cuposTotalesPeriodo();

    if (cuposTotales <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((this.estudiantesMatriculados() / cuposTotales) * 100),
    );
  });
  readonly etiquetaEstadoPeriodo = computed(() => {
    const estado = this.periodoActual()?.estado ?? '';

    return ETIQUETAS_ESTADO_PERIODO[estado] ?? 'Sin información';
  });

  ngOnInit(): void {
    this.cargarPanelAdministrativo();
  }

  obtenerNombreEstudiante(matricula: Matricula): string {
    const estudiante = matricula.estudiante;

    if (!estudiante) {
      return '—';
    }

    return [estudiante.nombres, estudiante.apellidos]
      .filter((parte) => parte.trim().length > 0)
      .join(' ')
      .trim();
  }

  obtenerCarreraEstudiante(matricula: Matricula): string {
    return matricula.estudiante?.carrera?.nombre ?? '—';
  }

  obtenerAsignaturaCurso(matricula: Matricula): string {
    return matricula.curso?.asignatura?.nombre ?? '—';
  }

  obtenerEtiquetaEstadoMatricula(estado: string): string {
    return ETIQUETAS_ESTADO_MATRICULA[estado] ?? estado;
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '—';
    }

    const fechaValida = new Date(fecha);

    if (Number.isNaN(fechaValida.getTime())) {
      return '—';
    }

    return fechaValida.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private cargarPanelAdministrativo(): void {
    if (!this.esGestorLecturaPersonas()) {
      this.cargandoResumen.set(false);
      return;
    }

    forkJoin({
      resumen: this.matriculasService.obtenerResumenMatriculas(),
      carrerasActivas: this.carrerasService.listarCarreras({
        activo: true,
        limite: 100,
      }),
      solicitudesPendientes: this.matriculasService.listarMatriculas({
        estado: ESTADOS_MATRICULA.inscrita,
        limit: 1,
      }),
    })
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe({
        next: (resultado) => {
          this.resumen.set(resultado.resumen.data ?? null);
          this.totalCarrerasActivas.set(resultado.carrerasActivas.total);
          this.totalSolicitudesPendientes.set(
            resultado.solicitudesPendientes.total,
          );
          this.cargarCuposDelPeriodo();
        },
        error: () => {
          this.cargandoResumen.set(false);
        },
      });
  }

  private cargarCuposDelPeriodo(): void {
    const periodo = this.periodoActual();

    if (!periodo) {
      this.cargandoResumen.set(false);
      return;
    }

    this.cursosService
      .listar({ periodo_id: periodo.id, limite: 100 })
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe({
        next: (respuesta) => {
          this.cuposTotalesPeriodo.set(
            (respuesta.data ?? []).reduce((total, curso) => total + curso.cupo_maximo, 0),
          );
          this.cargandoResumen.set(false);
        },
        error: () => {
          this.cargandoResumen.set(false);
        },
      });
  }
}
