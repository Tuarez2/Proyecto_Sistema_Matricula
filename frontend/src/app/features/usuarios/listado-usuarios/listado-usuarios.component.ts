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
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  debounceTime,
  merge,
  filter,
  finalize,
  switchMap,
  tap,
} from 'rxjs';

import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import type { Rol } from '../models/rol.model';
import {
  ESTADOS_USUARIO,
  type EstadoUsuario,
  type FiltrosListadoUsuarios,
  type RespuestaListadoUsuarios,
  type Usuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';

interface CambioConsulta {
  reiniciarPagina: boolean;
}

const LIMITE_POR_PAGINA = 10;
const DEBOUNCE_BUSQUEDA_MS = 350;

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
  private readonly estadoLimitePorPagina = signal(LIMITE_POR_PAGINA);
  private readonly estadoTotalUsuarios = signal(0);
  private readonly estadoTotalPaginas = signal(0);
  private readonly estadoFiltrosAplicados = signal<FiltrosListadoUsuarios>({});
  private readonly consultaFiltros$ = new Subject<CambioConsulta>();

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
  readonly filtrosActivos = computed(() =>
    this.contarFiltros(this.estadoFiltrosAplicados()),
  );
  readonly formularioFiltros = this.constructorFormulario.nonNullable.group({
    correo: ['', [Validators.maxLength(150)]],
    estado: [''],
    codigoRol: [''],
  });

  ngOnInit(): void {
    this.consultaFiltros$
      .pipe(
        switchMap((cambio) => {
          if (cambio.reiniciarPagina) {
            this.estadoPaginaActual.set(1);
          }
          return this.ejecutarConsultaUsuarios();
        }),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe();

    this.registrarFiltrosDinamicos();
    this.cargarRoles();
    this.consultaFiltros$.next({ reiniciarPagina: true });
  }

  buscarUsuarios(): void {
    if (this.formularioFiltros.controls.correo.invalid) {
      this.formularioFiltros.controls.correo.markAsTouched();
      return;
    }

    this.estadoFiltrosAplicados.set(this.obtenerFiltrosAplicables());
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset(
      {
        correo: '',
        estado: '',
        codigoRol: '',
      },
      { emitEvent: false },
    );
    this.estadoMensajeErrorUsuarios.set(null);
    this.estadoFiltrosAplicados.set({});
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  paginaAnterior(): void {
    if (!this.puedeIrPaginaAnterior()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual - 1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  paginaSiguiente(): void {
    if (!this.puedeIrPaginaSiguiente()) {
      return;
    }

    this.estadoPaginaActual.update((paginaActual) => paginaActual + 1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cambiarPagina(pagina: number): void {
    if (this.cargandoUsuarios() || pagina === this.paginaActual()) {
      return;
    }

    this.estadoPaginaActual.set(pagina);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  cargarUsuarios(): void {
    this.consultaFiltros$.next({ reiniciarPagina: false });
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

  private registrarFiltrosDinamicos(): void {
    const correoDebounced = this.formularioFiltros.controls.correo.valueChanges;

    const estados$ = [
      this.formularioFiltros.controls.estado,
      this.formularioFiltros.controls.codigoRol,
    ];

    merge(
      correoDebounced.pipe(debounceTime(DEBOUNCE_BUSQUEDA_MS)),
      estados$[0].valueChanges,
      estados$[1].valueChanges,
    )
      .pipe(
        filter(() => this.formularioFiltros.valid),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe(() => this.aplicarFiltrosDinamicos());
  }

  private aplicarFiltrosDinamicos(): void {
    if (this.formularioFiltros.controls.correo.invalid) {
      return;
    }

    const filtros = this.obtenerFiltrosAplicables();

    if (this.filtrosIguales(filtros)) {
      return;
    }

    this.estadoFiltrosAplicados.set(filtros);
    this.estadoPaginaActual.set(1);
    this.consultaFiltros$.next({ reiniciarPagina: false });
  }

  private ejecutarConsultaUsuarios(): Observable<RespuestaListadoUsuarios> {
    this.estadoMensajeErrorUsuarios.set(null);
    this.estadoCargandoUsuarios.set(true);
    return this.usuariosService.listarUsuarios(this.obtenerParametrosConsulta())
      .pipe(
        finalize(() => this.estadoCargandoUsuarios.set(false)),
        tap({
          next: (respuesta) => {
            this.estadoUsuarios.set(respuesta.data ?? []);
            this.estadoPaginaActual.set(respuesta.page);
            this.estadoTotalUsuarios.set(respuesta.total);
            this.estadoTotalPaginas.set(respuesta.totalPages);
          },
        }),
        catchError((error: unknown) => {
          this.estadoMensajeErrorUsuarios.set(this.obtenerMensajeError(error));
          return EMPTY;
        }),
      );
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

  private obtenerFiltrosAplicables(): FiltrosListadoUsuarios {
    const valoresFormulario = this.formularioFiltros.getRawValue();
    const filtros: FiltrosListadoUsuarios = {};
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

  private obtenerParametrosConsulta(): FiltrosListadoUsuarios {
    return {
      ...this.estadoFiltrosAplicados(),
      pagina: this.estadoPaginaActual(),
      limite: LIMITE_POR_PAGINA,
    };
  }

  private contarFiltros(filtros: FiltrosListadoUsuarios): number {
    return ['correo', 'estado', 'codigoRol'].filter(
      (clave) => filtros[clave as keyof FiltrosListadoUsuarios] !== undefined,
    ).length;
  }

  private filtrosIguales(filtros: FiltrosListadoUsuarios): boolean {
    return JSON.stringify(filtros) === JSON.stringify(this.estadoFiltrosAplicados());
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