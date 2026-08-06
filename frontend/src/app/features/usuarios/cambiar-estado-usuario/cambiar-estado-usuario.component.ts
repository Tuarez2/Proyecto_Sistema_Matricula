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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import {
  ESTADOS_USUARIO,
  type CambiarEstadoUsuarioSolicitud,
  type EstadoUsuario,
  type Usuario,
} from '../models/usuario.model';
import { UsuariosService } from '../services/usuarios.service';
import { BotonAtrasComponent } from '../../../shared/components/boton-atras/boton-atras.component';

@Component({
  selector: 'app-cambiar-estado-usuario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BotonAtrasComponent,
  ],
  templateUrl: './cambiar-estado-usuario.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiarEstadoUsuarioComponent implements OnInit {
  private readonly rutaActivada = inject(ActivatedRoute);
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoUsuario = signal<Usuario | null>(null);
  private readonly estadoCargandoUsuario = signal(false);
  private readonly estadoActualizandoEstado = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeAviso = signal<string | null>(null);
  private idUsuario: number | null = null;

  readonly ESTADOS_USUARIO = ESTADOS_USUARIO;
  readonly usuario = this.estadoUsuario.asReadonly();
  readonly cargandoUsuario = this.estadoCargandoUsuario.asReadonly();
  readonly actualizandoEstado = this.estadoActualizandoEstado.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeAviso = this.estadoMensajeAviso.asReadonly();
  readonly estadoActual = computed(() => this.usuario()?.estado ?? null);
  readonly esUsuarioActual = computed(
    () =>
      this.usuario()?.id ===
      this.autenticacionService.usuarioActual()?.id,
  );
  readonly puedeGuardar = computed(
    () =>
      !this.cargandoUsuario() &&
      !this.actualizandoEstado() &&
      this.usuario() !== null &&
      !this.esUsuarioActual(),
  );
  readonly formularioEstado = this.constructorFormulario.nonNullable.group({
    nuevoEstado: this.constructorFormulario.nonNullable.control<EstadoUsuario | ''>(
      '',
      [Validators.required],
    ),
  });

  ngOnInit(): void {
    const idUsuario = this.obtenerIdUsuario();

    if (idUsuario === null) {
      this.estadoMensajeError.set('El identificador del usuario no es válido.');
      return;
    }

    this.idUsuario = idUsuario;
    this.cargarUsuario();
  }

  guardarEstado(): void {
    if (this.actualizandoEstado()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);

    const usuario = this.usuario();
    const idUsuario = this.idUsuario;

    if (!usuario || idUsuario === null) {
      this.estadoMensajeError.set('No fue posible cambiar el estado del usuario.');
      return;
    }

    if (this.esUsuarioActual()) {
      this.estadoMensajeAviso.set('No puede modificar el estado de su propio usuario.');
      return;
    }

    if (this.formularioEstado.invalid) {
      this.formularioEstado.markAllAsTouched();
      return;
    }

    const nuevoEstado = this.formularioEstado.controls.nuevoEstado.value;

    if (!this.esEstadoUsuario(nuevoEstado)) {
      this.estadoMensajeError.set('Seleccione un estado válido.');
      return;
    }

    if (nuevoEstado === usuario.estado) {
      this.estadoMensajeAviso.set('El usuario ya tiene el estado seleccionado.');
      return;
    }

    const solicitud: CambiarEstadoUsuarioSolicitud = {
      estado: nuevoEstado,
    };

    this.estadoActualizandoEstado.set(true);
    this.usuariosService.cambiarEstadoUsuario(idUsuario, solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoActualizandoEstado.set(false)),
      )
      .subscribe({
        next: () => {
          this.estadoMensajeError.set(null);
          this.estadoMensajeAviso.set(null);
          void this.enrutador.navigateByUrl('/usuarios');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(
            this.obtenerMensajeErrorActualizacion(error),
          );
        },
      });
  }

  obtenerEtiquetaEstado(estado: EstadoUsuario): string {
    if (estado === ESTADOS_USUARIO.ACTIVO) {
      return 'Activo';
    }

    if (estado === ESTADOS_USUARIO.BLOQUEADO) {
      return 'Bloqueado';
    }

    return 'Inactivo';
  }

  obtenerNombreCompleto(usuario: Usuario): string {
    const nombreCompleto = [
      usuario.nombres.trim(),
      usuario.apellidos.trim(),
    ]
      .filter((parteNombre) => parteNombre.length > 0)
      .join(' ');

    return nombreCompleto || 'Usuario';
  }

  private obtenerIdUsuario(): number | null {
    const valorId = this.rutaActivada.snapshot.paramMap.get('id');

    if (valorId === null) {
      return null;
    }

    const idUsuario = Number(valorId);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return null;
    }

    return idUsuario;
  }

  private cargarUsuario(): void {
    if (this.cargandoUsuario() || this.idUsuario === null) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);
    this.estadoCargandoUsuario.set(true);
    this.usuariosService.obtenerUsuarioPorId(this.idUsuario)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoUsuario.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const usuario = respuesta.data;

          if (!usuario) {
            this.estadoMensajeError.set('No fue posible consultar el usuario.');
            return;
          }

          this.estadoUsuario.set(usuario);
          this.formularioEstado.reset({
            nuevoEstado: '',
          });

          if (this.esUsuarioActual()) {
            this.estadoMensajeAviso.set(
              'No puede modificar el estado de su propio usuario.',
            );
          }
        },
        error: (error: unknown) => {
          this.estadoUsuario.set(null);
          this.estadoMensajeError.set(this.obtenerMensajeErrorCarga(error));
        },
      });
  }

  private esEstadoUsuario(valor: string): valor is EstadoUsuario {
    return Object.values(ESTADOS_USUARIO).some((estado) => estado === valor);
  }

  private obtenerMensajeErrorCarga(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar el usuario.';
    }

    const codigo = this.obtenerCodigoError(error.error);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar el usuario.';
    }

    if (error.status === 404 || codigo === 'USUARIO_NOT_FOUND') {
      return 'El usuario solicitado no existe.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al consultar el usuario.';
    }

    return 'No fue posible consultar el usuario.';
  }

  private obtenerMensajeErrorActualizacion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cambiar el estado del usuario.';
    }

    const cuerpoError = error.error;
    const codigo = this.obtenerCodigoError(cuerpoError);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 400) {
      if (codigo === 'UNKNOWN_FIELDS') {
        return 'La solicitud contiene campos no permitidos.';
      }

      return this.obtenerMensajeBackend(cuerpoError) ?? 'Revise el estado seleccionado.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para cambiar el estado de usuarios.';
    }

    if (error.status === 404 || codigo === 'USUARIO_NOT_FOUND') {
      return 'El usuario solicitado no existe.';
    }

    if (error.status === 409) {
      if (codigo === 'SELF_DEACTIVATION_NOT_ALLOWED') {
        return 'No puede modificar el estado de su propio usuario.';
      }

      if (codigo === 'LAST_ACTIVE_ADMIN') {
        return 'No se puede cambiar el estado porque el sistema debe conservar al menos un administrador activo.';
      }

      return 'No fue posible cambiar el estado porque existe un conflicto.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al cambiar el estado del usuario.';
    }

    return 'No fue posible cambiar el estado del usuario.';
  }

  private obtenerMensajeBackend(cuerpoError: unknown): string | null {
    const mensaje = this.obtenerCadena(cuerpoError, 'message');

    if (!mensaje || !this.esMensajeSeguro(mensaje)) {
      return null;
    }

    return mensaje;
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
      !mensajeNormalizado.includes('contraseña') &&
      !mensajeNormalizado.includes('clave') &&
      !mensajeNormalizado.includes('secret');
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
