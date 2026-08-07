import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { CrearPeriodoAcademicoSolicitud } from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';

@Component({
  selector: 'app-crear-periodo',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './crear-periodo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearPeriodoComponent {
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly periodosAcademicosService = inject(PeriodosAcademicosService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoCreandoPeriodo = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeAviso = signal<string | null>(null);

  readonly creandoPeriodo = this.estadoCreandoPeriodo.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeAviso = this.estadoMensajeAviso.asReadonly();
  readonly puedeGuardar = computed(() => !this.creandoPeriodo());
  readonly formularioPeriodo = this.constructorFormulario.nonNullable.group(
    {
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      fechaInicioMatricula: ['', [Validators.required]],
      fechaFinMatricula: ['', [Validators.required]],
    },
    {
      validators: [this.crearValidadorFechasPeriodo()],
    },
  );

  guardarPeriodo(): void {
    if (this.creandoPeriodo()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);

    if (this.formularioPeriodo.invalid) {
      this.formularioPeriodo.markAllAsTouched();
      return;
    }

    const datos = this.formularioPeriodo.getRawValue();
    const fechaInicioMatriculaIso = this.convertirFechaHoraIso(
      datos.fechaInicioMatricula,
    );
    const fechaFinMatriculaIso = this.convertirFechaHoraIso(
      datos.fechaFinMatricula,
    );

    if (!fechaInicioMatriculaIso || !fechaFinMatriculaIso) {
      this.estadoMensajeError.set('Revise las fechas ingresadas.');
      return;
    }

    const solicitud: CrearPeriodoAcademicoSolicitud = {
      codigo: this.normalizarCodigo(datos.codigo),
      nombre: this.normalizarNombre(datos.nombre),
      fecha_inicio: datos.fechaInicio,
      fecha_fin: datos.fechaFin,
      fecha_inicio_matricula: fechaInicioMatriculaIso,
      fecha_fin_matricula: fechaFinMatriculaIso,
    };

    this.estadoCreandoPeriodo.set(true);
    this.periodosAcademicosService.crearPeriodo(solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCreandoPeriodo.set(false)),
      )
      .subscribe({
        next: () => {
          this.estadoMensajeError.set(null);
          this.estadoMensajeAviso.set(null);
          void this.enrutador.navigateByUrl('/periodos-academicos');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private convertirFechaHoraIso(valor: string): string | null {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor);

    if (!coincidencia) {
      return null;
    }

    const [, anioTexto, mesTexto, diaTexto, horaTexto, minutoTexto] = coincidencia;
    const anio = Number(anioTexto);
    const mes = Number(mesTexto);
    const dia = Number(diaTexto);
    const hora = Number(horaTexto);
    const minuto = Number(minutoTexto);

    if (
      !this.esFechaValida(anio, mes, dia) ||
      hora < 0 ||
      hora > 23 ||
      minuto < 0 ||
      minuto > 59
    ) {
      return null;
    }

    return `${anioTexto}-${mesTexto}-${diaTexto}T${horaTexto}:${minutoTexto}:00.000Z`;
  }

  private normalizarCodigo(valor: string): string {
    return valor.trim().toUpperCase();
  }

  private normalizarNombre(valor: string): string {
    return valor.trim().replace(/\s+/g, ' ');
  }

  private crearValidadorFechasPeriodo(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const fechaInicio = this.obtenerValorControl(control, 'fechaInicio');
      const fechaFin = this.obtenerValorControl(control, 'fechaFin');
      const fechaInicioMatricula = this.obtenerValorControl(
        control,
        'fechaInicioMatricula',
      );
      const fechaFinMatricula = this.obtenerValorControl(
        control,
        'fechaFinMatricula',
      );

      if (
        !fechaInicio ||
        !fechaFin ||
        !fechaInicioMatricula ||
        !fechaFinMatricula
      ) {
        return null;
      }

      const inicioPeriodo = this.obtenerInicioPeriodoUtc(fechaInicio);
      const finPeriodo = this.obtenerFinPeriodoUtc(fechaFin);
      const inicioMatriculaIso = this.convertirFechaHoraIso(fechaInicioMatricula);
      const finMatriculaIso = this.convertirFechaHoraIso(fechaFinMatricula);

      if (
        inicioPeriodo === null ||
        finPeriodo === null ||
        inicioMatriculaIso === null ||
        finMatriculaIso === null
      ) {
        return {
          fechaInvalida: true,
        };
      }

      if (fechaInicio >= fechaFin) {
        return {
          rangoPeriodoInvalido: true,
        };
      }

      const inicioMatricula = Date.parse(inicioMatriculaIso);
      const finMatricula = Date.parse(finMatriculaIso);

      if (inicioMatricula >= finMatricula) {
        return {
          rangoMatriculaInvalido: true,
        };
      }

      if (
        inicioMatricula < inicioPeriodo ||
        finMatricula > finPeriodo
      ) {
        return {
          matriculaFueraPeriodo: true,
        };
      }

      return null;
    };
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible crear el periodo académico.';
    }

    const cuerpoError = error.error;
    const codigo = this.obtenerCodigoError(cuerpoError);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (codigo === 'PERIODO_FECHAS_INVALIDAS') {
      return 'Las fechas ingresadas no son válidas.';
    }

    if (codigo === 'PERIODO_RANGO_INVALIDO') {
      return 'La fecha de inicio debe ser anterior a la fecha de fin.';
    }

    if (codigo === 'PERIODO_MATRICULA_RANGO_INVALIDO') {
      return 'El inicio de matrícula debe ser anterior al fin de matrícula.';
    }

    if (codigo === 'PERIODO_MATRICULA_FUERA_DE_RANGO') {
      return 'La ventana de matrícula debe estar dentro del periodo académico.';
    }

    if (codigo === 'UNKNOWN_FIELDS') {
      return 'La solicitud contiene campos no permitidos.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeBackend(cuerpoError) ??
        this.obtenerPrimerDetalle(cuerpoError) ??
        'Revise los datos del periodo académico.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para crear periodos académicos.';
    }

    if (error.status === 409) {
      if (codigo === 'PERIODO_CODIGO_DUPLICATED') {
        return 'El código del periodo académico ya está registrado.';
      }

      if (codigo === 'PERIODO_OPERATIVO_DUPLICATED') {
        return 'Ya existe un periodo académico en matrícula abierta o en curso.';
      }

      return 'No fue posible crear el periodo porque existe un conflicto.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al crear el periodo académico.';
    }

    return 'No fue posible crear el periodo académico.';
  }

  private obtenerInicioPeriodoUtc(valor: string): number | null {
    const partesFecha = this.obtenerPartesFecha(valor);

    if (!partesFecha) {
      return null;
    }

    return Date.UTC(partesFecha.anio, partesFecha.mes - 1, partesFecha.dia, 0, 0, 0, 0);
  }

  private obtenerFinPeriodoUtc(valor: string): number | null {
    const partesFecha = this.obtenerPartesFecha(valor);

    if (!partesFecha) {
      return null;
    }

    return Date.UTC(
      partesFecha.anio,
      partesFecha.mes - 1,
      partesFecha.dia,
      23,
      59,
      59,
      999,
    );
  }

  private obtenerPartesFecha(
    valor: string,
  ): { anio: number; mes: number; dia: number } | null {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

    if (!coincidencia) {
      return null;
    }

    const [, anioTexto, mesTexto, diaTexto] = coincidencia;
    const anio = Number(anioTexto);
    const mes = Number(mesTexto);
    const dia = Number(diaTexto);

    if (!this.esFechaValida(anio, mes, dia)) {
      return null;
    }

    return {
      anio,
      mes,
      dia,
    };
  }

  private esFechaValida(anio: number, mes: number, dia: number): boolean {
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      return false;
    }

    const fecha = new Date(Date.UTC(anio, mes - 1, dia));

    return fecha.getUTCFullYear() === anio &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia;
  }

  private obtenerValorControl(
    control: AbstractControl,
    nombreControl: string,
  ): string {
    const valor = control.get(nombreControl)?.value;

    return typeof valor === 'string' ? valor : '';
  }

  private obtenerMensajeBackend(cuerpoError: unknown): string | null {
    const mensaje = this.obtenerCadena(cuerpoError, 'message');

    if (!mensaje || !this.esMensajeSeguro(mensaje)) {
      return null;
    }

    return mensaje;
  }

  private obtenerPrimerDetalle(cuerpoError: unknown): string | null {
    if (!this.esRegistro(cuerpoError)) {
      return null;
    }

    const detalles = cuerpoError['details'];

    if (!Array.isArray(detalles)) {
      return null;
    }

    const primerDetalle = detalles.find(
      (detalle): detalle is string => typeof detalle === 'string',
    );

    if (!primerDetalle || !this.esMensajeSeguro(primerDetalle)) {
      return null;
    }

    return primerDetalle;
  }

  private obtenerCodigoError(cuerpoError: unknown): string | null {
    return this.obtenerCadena(cuerpoError, 'code');
  }

  private obtenerCadena(
    valor: unknown,
    propiedad: string,
  ): string | null {
    if (!this.esRegistro(valor)) {
      return null;
    }

    const dato = valor[propiedad];

    return typeof dato === 'string' ? dato : null;
  }

  private esMensajeSeguro(mensaje: string): boolean {
    const mensajeNormalizado = mensaje.toLowerCase();

    return !mensajeNormalizado.includes('token') &&
      !mensajeNormalizado.includes('stack') &&
      !mensajeNormalizado.includes('trace') &&
      !mensajeNormalizado.includes('servidor interno') &&
      !mensajeNormalizado.includes('configuración') &&
      !mensajeNormalizado.includes('configuracion') &&
      !mensajeNormalizado.includes('secret');
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
