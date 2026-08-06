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
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { Rol } from '../models/rol.model';
import {
  ESTADOS_USUARIO,
  type CrearUsuarioSolicitud,
  type EstadoUsuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';
import { BotonAtrasComponent } from '../../../shared/components/boton-atras/boton-atras.component';

@Component({
  selector: 'app-crear-usuario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BotonAtrasComponent,
  ],
  templateUrl: './crear-usuario.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearUsuarioComponent implements OnInit {
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoRoles = signal<Rol[]>([]);
  private readonly estadoCargandoRoles = signal(false);
  private readonly estadoCreandoUsuario = signal(false);
  private readonly estadoMensajeError = signal<string | null>(null);
  private readonly estadoMensajeErrorRoles = signal<string | null>(null);

  readonly ESTADOS_USUARIO = ESTADOS_USUARIO;
  readonly roles = this.estadoRoles.asReadonly();
  readonly cargandoRoles = this.estadoCargandoRoles.asReadonly();
  readonly creandoUsuario = this.estadoCreandoUsuario.asReadonly();
  readonly mensajeError = this.estadoMensajeError.asReadonly();
  readonly mensajeErrorRoles = this.estadoMensajeErrorRoles.asReadonly();
  readonly puedeGuardar = computed(
    () =>
      !this.cargandoRoles() &&
      !this.creandoUsuario() &&
      this.roles().length > 0,
  );
  readonly formularioUsuario = this.constructorFormulario.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    contrasena: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(128)],
    ],
    estado: this.constructorFormulario.nonNullable.control<EstadoUsuario>(
      ESTADOS_USUARIO.ACTIVO,
      [Validators.required],
    ),
    rolId: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    estudianteId: ['', [Validators.pattern(/^[1-9]\d*$/)]],
    docenteId: ['', [Validators.pattern(/^[1-9]\d*$/)]],
    debeCambiarContrasena: [true],
  });

  ngOnInit(): void {
    this.cargarRoles();
  }

  guardarUsuario(): void {
    if (this.creandoUsuario()) {
      return;
    }

    this.estadoMensajeError.set(null);

    if (this.cargandoRoles()) {
      return;
    }

    if (this.roles().length === 0) {
      this.estadoMensajeError.set('No existen roles activos disponibles.');
      return;
    }

    this.normalizarCamposTextoFormulario();

    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    const datosFormulario = this.formularioUsuario.getRawValue();
    const solicitud: CrearUsuarioSolicitud = {
      nombres: datosFormulario.nombres.trim(),
      apellidos: datosFormulario.apellidos.trim(),
      correo: datosFormulario.correo.trim(),
      password: datosFormulario.contrasena,
      estado: datosFormulario.estado as EstadoUsuario,
      rol_id: Number(datosFormulario.rolId),
      estudiante_id: this.normalizarIdOpcional(datosFormulario.estudianteId),
      docente_id: this.normalizarIdOpcional(datosFormulario.docenteId),
      debe_cambiar_password: datosFormulario.debeCambiarContrasena,
    };

    this.estadoCreandoUsuario.set(true);
    this.usuariosService.crearUsuario(solicitud)
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCreandoUsuario.set(false)),
      )
      .subscribe({
        next: () => {
          this.estadoMensajeError.set(null);
          void this.enrutador.navigateByUrl('/usuarios');
        },
        error: (error: unknown) => {
          this.estadoMensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private cargarRoles(): void {
    if (this.cargandoRoles()) {
      return;
    }

    this.estadoMensajeErrorRoles.set(null);
    this.estadoCargandoRoles.set(true);
    this.rolesService.listarRoles()
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoRoles.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          const roles = respuesta.data ?? [];

          this.estadoRoles.set(roles);

          if (roles.length === 0) {
            this.estadoMensajeErrorRoles.set('No existen roles activos disponibles.');
          }
        },
        error: (error: unknown) => {
          this.estadoMensajeErrorRoles.set(this.obtenerMensajeErrorRoles(error));
        },
      });
  }

  private normalizarIdOpcional(valor: string): number | null {
    const valorNormalizado = valor.trim();

    if (!valorNormalizado || !/^[1-9]\d*$/.test(valorNormalizado)) {
      return null;
    }

    return Number(valorNormalizado);
  }

  private normalizarCamposTextoFormulario(): void {
    const controles = this.formularioUsuario.controls;

    controles.nombres.setValue(controles.nombres.value.trim(), { emitEvent: false });
    controles.apellidos.setValue(controles.apellidos.value.trim(), { emitEvent: false });
    controles.correo.setValue(controles.correo.value.trim(), { emitEvent: false });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible crear el usuario.';
    }

    const cuerpoError = error.error;
    const codigo = this.obtenerCodigoError(cuerpoError);

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 400) {
      if (codigo === 'ROL_INACTIVE') {
        return 'El rol seleccionado no está activo.';
      }

      return this.obtenerMensajeValidacion(cuerpoError) ?? 'Revise los datos ingresados.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para crear usuarios.';
    }

    if (error.status === 404) {
      return this.obtenerMensajeNoEncontrado(codigo);
    }

    if (error.status === 409) {
      return this.obtenerMensajeConflicto(codigo, cuerpoError);
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al crear el usuario.';
    }

    return 'No fue posible crear el usuario.';
  }

  private obtenerMensajeErrorRoles(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'No fue posible conectar con el servidor para consultar los roles.';
    }

    return 'No fue posible consultar los roles.';
  }

  private obtenerMensajeNoEncontrado(codigo: string | null): string {
    if (codigo === 'ROL_NOT_FOUND') {
      return 'El rol seleccionado no existe.';
    }

    if (codigo === 'ESTUDIANTE_NOT_FOUND') {
      return 'El estudiante indicado no existe.';
    }

    if (codigo === 'DOCENTE_NOT_FOUND') {
      return 'El docente indicado no existe.';
    }

    return 'No se encontró uno de los registros relacionados.';
  }

  private obtenerMensajeConflicto(codigo: string | null, cuerpoError: unknown): string {
    if (codigo === 'USUARIO_CORREO_DUPLICATED') {
      return 'El correo ya está registrado.';
    }

    if (codigo === 'USUARIO_RELACION_DUPLICATED') {
      const campo = this.obtenerCampoDetalle(cuerpoError);

      if (campo === 'estudiante_id') {
        return 'El estudiante ya está asociado a otro usuario.';
      }

      if (campo === 'docente_id') {
        return 'El docente ya está asociado a otro usuario.';
      }

      return 'La relación seleccionada ya está asociada a otro usuario.';
    }

    return 'No fue posible crear el usuario.';
  }

  private obtenerMensajeValidacion(cuerpoError: unknown): string | null {
    const detalle = this.obtenerPrimerDetalle(cuerpoError);

    if (detalle && this.esRegistro(detalle) && typeof detalle['message'] === 'string') {
      return detalle['message'];
    }

    if (this.esRegistro(cuerpoError) && typeof cuerpoError['message'] === 'string') {
      return cuerpoError['message'];
    }

    return null;
  }

  private obtenerCodigoError(cuerpoError: unknown): string | null {
    if (!this.esRegistro(cuerpoError) || typeof cuerpoError['code'] !== 'string') {
      return null;
    }

    return cuerpoError['code'];
  }

  private obtenerCampoDetalle(cuerpoError: unknown): string | null {
    const detalle = this.obtenerPrimerDetalle(cuerpoError);

    if (detalle && this.esRegistro(detalle) && typeof detalle['field'] === 'string') {
      return detalle['field'];
    }

    if (!this.esRegistro(cuerpoError)) {
      return null;
    }

    const details = cuerpoError['details'];

    if (this.esRegistro(details) && typeof details['field'] === 'string') {
      return details['field'];
    }

    return null;
  }

  private obtenerPrimerDetalle(cuerpoError: unknown): unknown {
    if (!this.esRegistro(cuerpoError)) {
      return null;
    }

    const details = cuerpoError['details'];

    if (Array.isArray(details)) {
      return details[0] ?? null;
    }

    return details;
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
