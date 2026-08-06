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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import type { Rol } from '../models/rol.model';
import {
  ESTADOS_USUARIO,
  type EstadoUsuario,
  type FiltrosListadoUsuarios,
  type Usuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';

@Component({
  selector: 'app-listado-usuarios',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PaginationComponent,
  ],
  templateUrl: './listado-usuarios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoUsuariosComponent implements OnInit {
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoUsuarios = signal<Usuario[]>([]);
  private readonly estadoRoles = signal<Rol[]>([]);
  private readonly estadoCargandoUsuarios = signal(false);
  private readonly estadoCargandoRoles = signal(false);
  private readonly estadoMensajeErrorUsuarios = signal<string | null>(null);
  private readonly estadoMensajeErrorRoles = signal<string | null>(null);
  private readonly estadoPaginaActual = signal(1);
  private readonly estadoLimitePorPagina = signal(10);
  private readonly estadoTotalUsuarios = signal(0);
  private readonly estadoTotalPaginas = signal(0);

  readonly ESTADOS_USUARIO = ESTADOS_USUARIO;
  readonly usuarios = this.estadoUsuarios.asReadonly();
  readonly roles = this.estadoRoles.asReadonly();
  readonly cargandoUsuarios = this.estadoCargandoUsuarios.asReadonly();
  readonly cargandoRoles = this.estadoCargandoRoles.asReadonly();
  readonly mensajeErrorUsuarios = this.estadoMensajeErrorUsuarios.asReadonly();
  readonly mensajeErrorRoles = this.estadoMensajeErrorRoles.asReadonly();
  readonly paginaActual = this.estadoPaginaActual.asReadonly();
  readonly limitePorPagina = this.estadoLimitePorPagina.asReadonly();
  readonly totalUsuarios = this.estadoTotalUsuarios.asReadonly();
  readonly totalPaginas = this.estadoTotalPaginas.asReadonly();
  readonly puedeIrPaginaAnterior = computed(
    () => this.paginaActual() > 1 && !this.cargandoUsuarios(),
  );
  readonly puedeIrPaginaSiguiente = computed(
    () =>
      this.totalPaginas() > 0 &&
      this.paginaActual() < this.totalPaginas() &&
      !this.cargandoUsuarios(),
  );
  readonly formularioFiltros = this.constructorFormulario.nonNullable.group({
    correo: ['', [Validators.maxLength(150)]],
    estado: [''],
    codigoRol: [''],
  });

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  buscarUsuarios(): void {
    if (this.cargandoUsuarios()) {
      return;
    }

    if (this.formularioFiltros.controls.correo.invalid) {
      this.formularioFiltros.controls.correo.markAsTouched();
      return;
    }

    this.estadoPaginaActual.set(1);
    this.cargarUsuarios();
  }

  limpiarFiltros(): void {
    if (this.cargandoUsuarios()) {
      return;
    }

    this.formularioFiltros.reset({
      correo: '',
      estado: '',
      codigoRol: '',
    });
    this.estadoPaginaActual.set(1);
    this.cargarUsuarios();
  }

  paginaAnterior(): void {
    if (!this.puedeIrPaginaAnterior()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual - 1);
    this.cargarUsuarios();
  }

  paginaSiguiente(): void {
    if (!this.puedeIrPaginaSiguiente()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual + 1);
    this.cargarUsuarios();
  }

  cambiarPagina(pagina: number): void {
    if (this.cargandoUsuarios() || pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.cargarUsuarios();
  }

  obtenerEtiquetaEstado(estado: EstadoUsuario): string {
    if (estado === ESTADOS_USUARIO.ACTIVO) {
      return 'Activo';
    }

    if (estado === ESTADOS_USUARIO.BLOQUEADO) {
      return 'Bloqueado';
    }

    if (estado === ESTADOS_USUARIO.INACTIVO) {
      return 'Inactivo';
    }

    return 'Estado desconocido';
  }

  obtenerClaseEstado(estado: EstadoUsuario): string {
    if (estado === ESTADOS_USUARIO.ACTIVO) {
      return 'estado-badge--success';
    }

    if (estado === ESTADOS_USUARIO.BLOQUEADO) {
      return 'estado-badge--danger';
    }

    return 'estado-badge--neutral';
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

  cargarUsuarios(): void {
    if (this.cargandoUsuarios()) {
      return;
    }

    this.estadoMensajeErrorUsuarios.set(null);
    this.estadoCargandoUsuarios.set(true);
    this.usuariosService.listarUsuarios(this.obtenerFiltrosUsuarios())
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCargandoUsuarios.set(false)),
      )
      .subscribe({
        next: (respuesta) => {
          this.estadoUsuarios.set(respuesta.data ?? []);
          this.estadoPaginaActual.set(respuesta.page);
          this.estadoLimitePorPagina.set(respuesta.limit);
          this.estadoTotalUsuarios.set(respuesta.total);
          this.estadoTotalPaginas.set(respuesta.totalPages);
        },
        error: (error: unknown) => {
          this.estadoMensajeErrorUsuarios.set(this.obtenerMensajeError(error));
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
          this.estadoMensajeErrorRoles.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerFiltrosUsuarios(): FiltrosListadoUsuarios {
    const valoresFormulario = this.formularioFiltros.getRawValue();
    const filtros: FiltrosListadoUsuarios = {
      pagina: this.paginaActual(),
      limite: this.limitePorPagina(),
    };
    const correo = valoresFormulario.correo.trim();

    if (correo) {
      filtros.correo = correo;
    }

    if (this.esEstadoUsuario(valoresFormulario.estado)) {
      filtros.estado = valoresFormulario.estado;
    }

    if (valoresFormulario.codigoRol) {
      filtros.codigoRol = valoresFormulario.codigoRol;
    }

    return filtros;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible consultar los datos.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar usuarios.';
    }

    if (error.status === 429) {
      return 'Demasiadas solicitudes. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor al consultar los datos.';
    }

    return 'No fue posible consultar los datos.';
  }

  private esEstadoUsuario(valor: string): valor is EstadoUsuario {
    return Object.values(ESTADOS_USUARIO).some((estado) => estado === valor);
  }
}
