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
import { Observable, catchError, finalize, map, of, switchMap } from 'rxjs';

import { CODIGOS_ROL } from '../../../core/config/codigos-rol';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type { Rol } from '../models/rol.model';
import {
  ESTADOS_USUARIO,
  type ActualizarUsuarioSolicitud,
  type RolUsuario,
  type Usuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';

@Component({
  selector: 'app-editar-usuario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './editar-usuario.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarUsuarioComponent implements OnInit {
  private readonly rutaActivada = inject(ActivatedRoute);
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoUsuarioOriginal = signal<Usuario | null>(null);
  private readonly estadoRoles = signal<Rol[]>([]);
  private readonly estadoCargandoUsuario = signal(false);
  private readonly estadoCargandoRoles = signal(false);
  private readonly estadoActualizandoUsuario = signal(false);
  private readonly estadoMensajeErrorUsuario = signal<string | null>(null);
  private readonly estadoMensajeErrorRoles = signal<string | null>(null);
  private readonly estadoMensajeAviso = signal<string | null>(null);
  private idUsuario: number | null = null;

  readonly ESTADOS_USUARIO = ESTADOS_USUARIO;
  readonly usuarioOriginal = this.estadoUsuarioOriginal.asReadonly();
  readonly roles = this.estadoRoles.asReadonly();
  readonly cargandoUsuario = this.estadoCargandoUsuario.asReadonly();
  readonly cargandoRoles = this.estadoCargandoRoles.asReadonly();
  readonly actualizandoUsuario = this.estadoActualizandoUsuario.asReadonly();
  readonly mensajeErrorUsuario = this.estadoMensajeErrorUsuario.asReadonly();
  readonly mensajeErrorRoles = this.estadoMensajeErrorRoles.asReadonly();
  readonly mensajeAviso = this.estadoMensajeAviso.asReadonly();
  readonly rolesDisponibles = computed(() => {
    const rolesActivos = this.roles().filter((rol) => rol.activo);
    const rolesPorId = new Map<number, Rol>();

    for (const rol of rolesActivos) {
      rolesPorId.set(rol.id, { ...rol });
    }

    const rolActual = this.usuarioOriginal()?.rol;

    if (rolActual && !rolesPorId.has(rolActual.id)) {
      rolesPorId.set(rolActual.id, this.convertirRolUsuario(rolActual));
    }

    return Array.from(rolesPorId.values());
  });
  readonly puedeGuardar = computed(
    () =>
      !this.cargandoUsuario() &&
      !this.actualizandoUsuario() &&
      this.usuarioOriginal() !== null &&
      this.rolesDisponibles().length > 0,
  );
  readonly formularioUsuario = this.constructorFormulario.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    rolId: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    estudianteId: ['', [Validators.pattern(/^[1-9]\d*$/)]],
    docenteId: ['', [Validators.pattern(/^[1-9]\d*$/)]],
    debeCambiarContrasena: [false],
  });

  ngOnInit(): void {
    const idUsuario = this.obtenerIdUsuario();

    if (idUsuario === null) {
      this.estadoMensajeErrorUsuario.set('El identificador del usuario no es válido.');
      return;
    }

    this.idUsuario = idUsuario;
    this.cargarUsuario();
    this.cargarRoles();
  }

  guardarCambios(): void {
    if (this.actualizandoUsuario()) {
      return;
    }

    this.estadoMensajeErrorUsuario.set(null);
    this.estadoMensajeAviso.set(null);

    const usuarioOriginal = this.usuarioOriginal();
    const idUsuario = this.idUsuario;

    if (!usuarioOriginal || idUsuario === null) {
      this.estadoMensajeErrorUsuario.set('No fue posible actualizar el usuario.');
      return;
    }

    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    const solicitud = this.construirSolicitudActualizacion();

    if (Object.keys(solicitud).length === 0) {
      this.estadoMensajeAviso.set('No existen cambios para guardar.');
      return;
    }

    const esUsuarioActual =
      this.autenticacionService.usuarioActual()?.id === idUsuario;

    this.estadoActualizandoUsuario.set(true);
    this.usuariosService.actualizarUsuario(idUsuario, solicitud)
      .pipe(
        switchMap(() =>
          esUsuarioActual ? this.actualizarPerfilActual() : of('/usuarios'),
        ),
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoActualizandoUsuario.set(false)),
      )
      .subscribe({
        next: (rutaDestino) => {
          void this.enrutador.navigateByUrl(rutaDestino);
        },
        error: (error: unknown) => {
          this.estadoMensajeErrorUsuario.set(this.obtenerMensajeError(error));
        },
      });
  }

  obtenerEtiquetaEstado(usuario: Usuario): string {
    if (usuario.estado === ESTADOS_USUARIO.ACTIVO) {
      return 'Activo';
    }

    if (usuario.estado === ESTADOS_USUARIO.BLOQUEADO) {
      return 'Bloqueado';
    }

    return 'Inactivo';
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

    this.estadoMensajeErrorUsuario.set(null);
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
            this.estadoMensajeErrorUsuario.set('No fue posible consultar el usuario.');
            return;
          }

          this.estadoUsuarioOriginal.set(usuario);
          this.formularioUsuario.setValue({
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            correo: usuario.correo,
            rolId: String(usuario.rol_id),
            estudianteId: usuario.estudiante_id === null
              ? ''
              : String(usuario.estudiante_id),
            docenteId: usuario.docente_id === null ? '' : String(usuario.docente_id),
            debeCambiarContrasena: usuario.debe_cambiar_password,
          });
          this.formularioUsuario.markAsPristine();
        },
        error: (error: unknown) => {
          this.estadoUsuarioOriginal.set(null);
          this.estadoMensajeErrorUsuario.set(
            this.obtenerMensajeErrorConsultaUsuario(error),
          );
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
          this.estadoRoles.set(respuesta.data ?? []);
        },
        error: (error: unknown) => {
          this.estadoMensajeErrorRoles.set(this.obtenerMensajeErrorRoles(error));
        },
      });
  }

  private construirSolicitudActualizacion(): ActualizarUsuarioSolicitud {
    const usuarioOriginal = this.usuarioOriginal();

    if (!usuarioOriginal) {
      return {};
    }

    const valoresFormulario = this.formularioUsuario.getRawValue();
    const solicitud: ActualizarUsuarioSolicitud = {};
    const nombres = valoresFormulario.nombres.trim();
    const apellidos = valoresFormulario.apellidos.trim();
    const correo = valoresFormulario.correo.trim();
    const rolId = Number(valoresFormulario.rolId);
    const estudianteId = this.normalizarIdOpcional(valoresFormulario.estudianteId);
    const docenteId = this.normalizarIdOpcional(valoresFormulario.docenteId);

    if (nombres !== usuarioOriginal.nombres) {
      solicitud.nombres = nombres;
    }

    if (apellidos !== usuarioOriginal.apellidos) {
      solicitud.apellidos = apellidos;
    }

    if (correo !== usuarioOriginal.correo) {
      solicitud.correo = correo;
    }

    if (rolId !== usuarioOriginal.rol_id) {
      solicitud.rol_id = rolId;
    }

    if (estudianteId !== usuarioOriginal.estudiante_id) {
      solicitud.estudiante_id = estudianteId;
    }

    if (docenteId !== usuarioOriginal.docente_id) {
      solicitud.docente_id = docenteId;
    }

    if (valoresFormulario.debeCambiarContrasena !==
      usuarioOriginal.debe_cambiar_password) {
      solicitud.debe_cambiar_password = valoresFormulario.debeCambiarContrasena;
    }

    return solicitud;
  }

  private normalizarIdOpcional(valor: string): number | null {
    const valorNormalizado = valor.trim();

    if (!valorNormalizado || !/^[1-9]\d*$/.test(valorNormalizado)) {
      return null;
    }

    return Number(valorNormalizado);
  }

  private actualizarPerfilActual(): Observable<string> {
    return this.autenticacionService.consultarPerfil().pipe(
      map((respuesta) =>
        respuesta.data?.user.rol?.codigo === CODIGOS_ROL.ADMIN ? '/usuarios' : '/',
      ),
      catchError(() => of('/')),
    );
  }

  private convertirRolUsuario(rolUsuario: RolUsuario): Rol {
    return {
      id: rolUsuario.id,
      codigo: rolUsuario.codigo,
      nombre: rolUsuario.nombre,
      descripcion: null,
      activo: rolUsuario.activo,
    };
  }

  private obtenerMensajeErrorConsultaUsuario(error: unknown): string {
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

  private obtenerMensajeErrorRoles(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'No fue posible conectar con el servidor para consultar los roles.';
    }

    return 'No fue posible consultar los roles.';
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible actualizar el usuario.';
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

      if (codigo === 'EMPTY_UPDATE_PAYLOAD') {
        return 'No existen cambios válidos para guardar.';
      }

      return this.obtenerMensajeValidacion(cuerpoError) ?? 'Revise los datos ingresados.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para editar usuarios.';
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
      return 'Ocurrió un error en el servidor al actualizar el usuario.';
    }

    return 'No fue posible actualizar el usuario.';
  }

  private obtenerMensajeNoEncontrado(codigo: string | null): string {
    if (codigo === 'USUARIO_NOT_FOUND') {
      return 'El usuario solicitado no existe.';
    }

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
    }

    if (codigo === 'LAST_ACTIVE_ADMIN') {
      return 'No se puede cambiar el rol porque el sistema debe conservar al menos un administrador activo.';
    }

    return 'No fue posible guardar los cambios porque existe un conflicto.';
  }

  private obtenerMensajeValidacion(cuerpoError: unknown): string | null {
    const detalle = this.obtenerPrimerDetalle(cuerpoError);

    if (detalle && this.esRegistro(detalle) && typeof detalle['message'] === 'string') {
      return this.esMensajeSeguro(detalle['message']) ? detalle['message'] : null;
    }

    if (this.esRegistro(cuerpoError) && typeof cuerpoError['message'] === 'string') {
      return this.esMensajeSeguro(cuerpoError['message']) ? cuerpoError['message'] : null;
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

  private esMensajeSeguro(mensaje: string): boolean {
    const mensajeNormalizado = mensaje.toLowerCase();

    return !mensajeNormalizado.includes('token') &&
      !mensajeNormalizado.includes('password') &&
      !mensajeNormalizado.includes('contraseña') &&
      !mensajeNormalizado.includes('contrasena');
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
