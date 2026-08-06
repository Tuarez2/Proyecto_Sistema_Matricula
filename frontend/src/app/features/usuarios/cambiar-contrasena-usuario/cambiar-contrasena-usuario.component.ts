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
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  CambiarContrasenaUsuarioSolicitud,
  EstadoUsuario,
  Usuario,
} from '../models/usuario.model';
import { UsuariosService } from '../services/usuarios.service';

@Component({
  selector: 'app-cambiar-contrasena-usuario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './cambiar-contrasena-usuario.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiarContrasenaUsuarioComponent implements OnInit {
  private readonly rutaActivada = inject(ActivatedRoute);
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoUsuario = signal<Usuario | null>(null);
  private readonly estadoCargandoUsuario = signal(false);
  private readonly estadoActualizandoContrasena = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeAviso = signal<string | null>(null);
  private idUsuario: number | null = null;

  readonly usuario = this.estadoUsuario.asReadonly();
  readonly cargandoUsuario = this.estadoCargandoUsuario.asReadonly();
  readonly actualizandoContrasena =
    this.estadoActualizandoContrasena.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeAviso = this.estadoMensajeAviso.asReadonly();
  readonly esUsuarioActual = computed(
    () =>
      this.usuario()?.id ===
      this.autenticacionService.usuarioActual()?.id,
  );
  readonly puedeGuardar = computed(
    () =>
      !this.cargandoUsuario() &&
      !this.actualizandoContrasena() &&
      this.usuario() !== null,
  );
  readonly formularioContrasena = this.constructorFormulario.nonNullable.group(
    {
      nuevaContrasena: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(128),
      ]],
      confirmacionContrasena: ['', [
        Validators.required,
        Validators.maxLength(128),
      ]],
    },
    {
      validators: [this.crearValidadorCoincidenciaContrasenas()],
    },
  );

  ngOnInit(): void {
    const idUsuario = this.obtenerIdUsuario();

    if (idUsuario === null) {
      this.estadoMensajeError.set('El identificador del usuario no es válido.');
      return;
    }

    this.idUsuario = idUsuario;
    this.cargarUsuario();
  }

  guardarContrasena(): void {
    if (this.actualizandoContrasena()) {
      return;
    }

    this.estadoMensajeError.set(null);
    this.estadoMensajeAviso.set(null);

    const usuario = this.usuario();
    const idUsuario = this.idUsuario;

    if (!usuario || idUsuario === null) {
      this.estadoMensajeError.set(
        'No fue posible cambiar la contraseña del usuario.',
      );
      return;
    }

    if (this.formularioContrasena.invalid) {
      this.formularioContrasena.markAllAsTouched();
      return;
    }

    const datosFormulario = this.formularioContrasena.getRawValue();

    if (
      datosFormulario.nuevaContrasena !==
      datosFormulario.confirmacionContrasena
    ) {
      this.formularioContrasena.setErrors({
        ...(this.formularioContrasena.errors ?? {}),
        contrasenasNoCoinciden: true,
      });
      this.formularioContrasena.markAllAsTouched();
      return;
    }

    const solicitud: CambiarContrasenaUsuarioSolicitud = {
      password: datosFormulario.nuevaContrasena,
    };
    const esUsuarioActual =
      this.autenticacionService.usuarioActual()?.id === idUsuario;

    this.estadoActualizandoContrasena.set(true);
    this.usuariosService.cambiarContrasenaUsuario(idUsuario, solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoActualizandoContrasena.set(false)),
      )
      .subscribe({
        next: () => {
          this.estadoMensajeError.set(null);
          this.estadoMensajeAviso.set(null);

          if (esUsuarioActual) {
            this.autenticacionService.limpiarSesion();
            void this.enrutador.navigateByUrl('/iniciar-sesion');
            return;
          }

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
    if (estado === 'activo') {
      return 'Activo';
    }

    if (estado === 'bloqueado') {
      return 'Bloqueado';
    }

    return 'Inactivo';
  }

  obtenerClaseEstado(estado: EstadoUsuario): string {
    if (estado === 'activo') {
      return 'estado-badge--success';
    }

    if (estado === 'bloqueado') {
      return 'estado-badge--danger';
    }

    return 'estado-badge--neutral';
  }

  obtenerNombreCompleto(usuario: Usuario): string {
    const nombreCompleto = [
      usuario.nombres,
      usuario.apellidos,
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

    if (!/^[1-9]\d*$/.test(valorId)) {
      return null;
    }

    return Number(valorId);
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
          this.formularioContrasena.reset({
            nuevaContrasena: '',
            confirmacionContrasena: '',
          });
          this.estadoMensajeAviso.set(null);
        },
        error: (error: unknown) => {
          this.estadoUsuario.set(null);
          this.estadoMensajeError.set(this.obtenerMensajeErrorCarga(error));
        },
      });
  }

  private crearValidadorCoincidenciaContrasenas(): ValidatorFn {
    return (control): ValidationErrors | null => {
      const nuevaContrasena = control.get('nuevaContrasena')?.value;
      const confirmacionContrasena = control.get('confirmacionContrasena')?.value;

      if (
        typeof nuevaContrasena !== 'string' ||
        typeof confirmacionContrasena !== 'string' ||
        nuevaContrasena.length === 0 ||
        confirmacionContrasena.length === 0 ||
        nuevaContrasena === confirmacionContrasena
      ) {
        return null;
      }

      return {
        contrasenasNoCoinciden: true,
      };
    };
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
      return 'No fue posible cambiar la contraseña del usuario.';
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

      return this.obtenerMensajeBackend(cuerpoError) ??
        this.obtenerPrimerDetalle(cuerpoError) ??
        'Revise la contraseña ingresada.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para cambiar contraseñas de usuarios.';
    }

    if (error.status === 404 || codigo === 'USUARIO_NOT_FOUND') {
      return 'El usuario solicitado no existe.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al cambiar la contraseña.';
    }

    return 'No fue posible cambiar la contraseña del usuario.';
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
      !mensajeNormalizado.includes('contraseña') &&
      !mensajeNormalizado.includes('contrasena') &&
      !mensajeNormalizado.includes('confirmación') &&
      !mensajeNormalizado.includes('confirmacion') &&
      !mensajeNormalizado.includes('clave') &&
      !mensajeNormalizado.includes('secret');
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
