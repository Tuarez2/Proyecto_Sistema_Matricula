import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ESTADOS_PERIODO_ACADEMICO,
  type ActualizarPeriodoAcademicoSolicitud,
  type EstadoPeriodoAcademico,
  type PeriodoAcademico,
} from '../models/periodo-academico.model';
import { PeriodosAcademicosService } from '../services/periodos-academicos.service';

@Component({
  selector: 'app-editar-periodo',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './editar-periodo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarPeriodoComponent implements OnInit {
  private readonly rutaActivada = inject(ActivatedRoute);
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly periodosAcademicosService = inject(PeriodosAcademicosService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoPeriodoOriginal = signal<PeriodoAcademico | null>(null);
  private readonly estadoCargandoPeriodo = signal(false);
  private readonly estadoActualizandoPeriodo = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeAviso = signal<string | null>(null);
  private idPeriodo: number | null = null;

  readonly periodoOriginal = this.estadoPeriodoOriginal.asReadonly();
  readonly cargandoPeriodo = this.estadoCargandoPeriodo.asReadonly();
  readonly actualizandoPeriodo = this.estadoActualizandoPeriodo.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeAviso = this.estadoMensajeAviso.asReadonly();
  readonly puedeGuardar = computed(
    () =>
      !this.cargandoPeriodo() &&
      !this.actualizandoPeriodo() &&
      this.periodoOriginal() !== null,
  );
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

  ngOnInit(): void {
    const idPeriodo = this.obtenerIdPeriodo();

    if (idPeriodo === null) {
      this.estadoMensajeError.set(
        'El identificador del periodo académico no es válido.',
      );
      return;
    }

    this.idPeriodo = idPeriodo;
    this.cargarPeriodo();
  }

  guardarCambios(): void {
    if (this.actualizandoPeriodo()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);

    if (!this.periodoOriginal() || this.idPeriodo === null) {
      this.estadoMensajeError.set('No fue posible actualizar el periodo académico.');
      return;
    }

    if (this.formularioPeriodo.invalid) {
      this.formularioPeriodo.markAllAsTouched();
      return;
    }

    const solicitud = this.construirSolicitudActualizacion();

    if (Object.keys(solicitud).length === 0) {
      this.estadoMensajeAviso.set('No existen cambios para guardar.');
      return;
    }

    this.estadoActualizandoPeriodo.set(true);
    this.periodosAcademicosService.actualizarPeriodo(this.idPeriodo, solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoActualizandoPeriodo.set(false)),
      )
      .subscribe({
        next: () => {
          this.estadoMensajeError.set(null);
          this.estadoMensajeAviso.set(null);
          void this.enrutador.navigateByUrl('/periodos-academicos');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(
            this.obtenerMensajeErrorActualizacion(error),
          );
        },
      });
  }

  obtenerEtiquetaEstado(estado: EstadoPeriodoAcademico): string {
    if (estado === ESTADOS_PERIODO_ACADEMICO.PLANIFICADO) {
      return 'Planificado';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.MATRICULA_ABIERTA) {
      return 'Matrícula abierta';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.EN_CURSO) {
      return 'En curso';
    }

    if (estado === ESTADOS_PERIODO_ACADEMICO.CERRADO) {
      return 'Cerrado';
    }

    return 'Estado desconocido';
  }

  private obtenerIdPeriodo(): number | null {
    const idParametro = this.rutaActivada.snapshot.paramMap.get('id');

    if (!idParametro || !/^[1-9]\d*$/.test(idParametro)) {
      return null;
    }

    const idPeriodo = Number(idParametro);

    if (!Number.isSafeInteger(idPeriodo) || idPeriodo <= 0) {
      return null;
    }

    return idPeriodo;
  }

  private cargarPeriodo(): void {
    if (this.cargandoPeriodo() || this.idPeriodo === null) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);
    this.estadoCargandoPeriodo.set(true);

    this.periodosAcademicosService.obtenerPeriodoPorId(this.idPeriodo)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoPeriodo.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const periodo = respuesta.data;

          if (!periodo) {
            this.estadoPeriodoOriginal.set(null);
            this.estadoMensajeError.set(
              'No fue posible consultar el periodo académico.',
            );
            return;
          }

          const fechaInicioMatricula = this.convertirIsoAFechaHora(
            periodo.fecha_inicio_matricula,
          );
          const fechaFinMatricula = this.convertirIsoAFechaHora(
            periodo.fecha_fin_matricula,
          );

          if (
            !this.obtenerPartesFecha(periodo.fecha_inicio) ||
            !this.obtenerPartesFecha(periodo.fecha_fin) ||
            fechaInicioMatricula === null ||
            fechaFinMatricula === null
          ) {
            this.estadoPeriodoOriginal.set(null);
            this.estadoMensajeError.set(
              'No fue posible interpretar las fechas del periodo académico.',
            );
            return;
          }

          this.estadoPeriodoOriginal.set(periodo);
          this.formularioPeriodo.reset({
            codigo: periodo.codigo,
            nombre: periodo.nombre,
            fechaInicio: periodo.fecha_inicio,
            fechaFin: periodo.fecha_fin,
            fechaInicioMatricula,
            fechaFinMatricula,
          });
          this.formularioPeriodo.markAsPristine();
        },
        error: (error: unknown) => {
          this.estadoPeriodoOriginal.set(null);
          this.estadoMensajeError.set(this.obtenerMensajeErrorCarga(error));
        },
      });
  }

  private construirSolicitudActualizacion():
    ActualizarPeriodoAcademicoSolicitud {
    const periodoOriginal = this.periodoOriginal();

    if (!periodoOriginal) {
      return {};
    }

    const datos = this.formularioPeriodo.getRawValue();
    const solicitud: ActualizarPeriodoAcademicoSolicitud = {};
    const codigo = this.normalizarCodigo(datos.codigo);
    const nombre = this.normalizarNombre(datos.nombre);
    const fechaInicioMatriculaIso = this.convertirFechaHoraIso(
      datos.fechaInicioMatricula,
    );
    const fechaFinMatriculaIso = this.convertirFechaHoraIso(
      datos.fechaFinMatricula,
    );
    const fechaInicioMatriculaOriginal = this.obtenerIsoCanonicoMatricula(
      periodoOriginal.fecha_inicio_matricula,
    );
    const fechaFinMatriculaOriginal = this.obtenerIsoCanonicoMatricula(
      periodoOriginal.fecha_fin_matricula,
    );

    if (codigo !== periodoOriginal.codigo) {
      solicitud.codigo = codigo;
    }

    if (nombre !== periodoOriginal.nombre) {
      solicitud.nombre = nombre;
    }

    if (datos.fechaInicio !== periodoOriginal.fecha_inicio) {
      solicitud.fecha_inicio = datos.fechaInicio;
    }

    if (datos.fechaFin !== periodoOriginal.fecha_fin) {
      solicitud.fecha_fin = datos.fechaFin;
    }

    if (
      fechaInicioMatriculaIso !== null &&
      fechaInicioMatriculaIso !== fechaInicioMatriculaOriginal
    ) {
      solicitud.fecha_inicio_matricula = fechaInicioMatriculaIso;
    }

    if (
      fechaFinMatriculaIso !== null &&
      fechaFinMatriculaIso !== fechaFinMatriculaOriginal
    ) {
      solicitud.fecha_fin_matricula = fechaFinMatriculaIso;
    }

    return solicitud;
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

  private convertirIsoAFechaHora(valor: string): string | null {
    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    return `${fecha.getUTCFullYear()}-${this.completarDosDigitos(
      fecha.getUTCMonth() + 1,
    )}-${this.completarDosDigitos(
      fecha.getUTCDate(),
    )}T${this.completarDosDigitos(
      fecha.getUTCHours(),
    )}:${this.completarDosDigitos(fecha.getUTCMinutes())}`;
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

  private obtenerMensajeErrorCarga(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el periodo académico.';
    }

    const codigo = this.obtenerCodigoError(error.error);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar el periodo académico.';
    }

    if (error.status === 404 || codigo === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El periodo académico solicitado no existe.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al consultar el periodo académico.';
    }

    return 'No fue posible consultar el periodo académico.';
  }

  private obtenerMensajeErrorActualizacion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible actualizar el periodo académico.';
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

    if (codigo === 'EMPTY_UPDATE_PAYLOAD') {
      return 'No existen cambios válidos para guardar.';
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
      return 'No tiene permisos para editar periodos académicos.';
    }

    if (error.status === 404 || codigo === 'PERIODO_ACADEMICO_NOT_FOUND') {
      return 'El periodo académico solicitado no existe.';
    }

    if (error.status === 409) {
      if (codigo === 'PERIODO_CODIGO_DUPLICATED') {
        return 'El código del periodo académico ya está registrado.';
      }

      if (codigo === 'PERIODO_FECHAS_CON_DEPENDENCIAS') {
        const detalles = this.obtenerDetallesDependencias(cuerpoError);
        const mensajeBase = 'No se pueden modificar las fechas porque el periodo académico tiene cursos o matrículas asociados.';

        if (!detalles) {
          return mensajeBase;
        }

        return `${mensajeBase} Cursos asociados: ${detalles.cursos}. Matrículas asociadas: ${detalles.matriculas}.`;
      }

      return 'No fue posible actualizar el periodo porque existe un conflicto.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al actualizar el periodo académico.';
    }

    return 'No fue posible actualizar el periodo académico.';
  }

  private obtenerIsoCanonicoMatricula(valor: string): string {
    const fechaFormulario = this.convertirIsoAFechaHora(valor);

    if (fechaFormulario === null) {
      return valor;
    }

    return this.convertirFechaHoraIso(fechaFormulario) ?? valor;
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

  private completarDosDigitos(valor: number): string {
    return String(valor).padStart(2, '0');
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

  private obtenerDetallesDependencias(
    cuerpoError: unknown,
  ): { cursos: number; matriculas: number } | null {
    if (!this.esRegistro(cuerpoError) || !this.esRegistro(cuerpoError['details'])) {
      return null;
    }

    const cursos = cuerpoError['details']['cursos'];
    const matriculas = cuerpoError['details']['matriculas'];

    if (
      !this.esEnteroSeguroNoNegativo(cursos) ||
      !this.esEnteroSeguroNoNegativo(matriculas)
    ) {
      return null;
    }

    return {
      cursos,
      matriculas,
    };
  }

  private esEnteroSeguroNoNegativo(valor: unknown): valor is number {
    return typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0;
  }

  private esMensajeSeguro(mensaje: string): boolean {
    const mensajeNormalizado = mensaje.toLowerCase();

    return !mensajeNormalizado.includes('token') &&
      !mensajeNormalizado.includes('stack') &&
      !mensajeNormalizado.includes('trace') &&
      !mensajeNormalizado.includes('servidor interno') &&
      !mensajeNormalizado.includes('configuración') &&
      !mensajeNormalizado.includes('configuracion') &&
      !mensajeNormalizado.includes('secret') &&
      !mensajeNormalizado.includes('consulta interna');
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
