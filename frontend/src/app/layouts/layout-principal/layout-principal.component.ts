import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';

@Component({
  selector: 'app-layout-principal',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  host: {
    '[class.tema-docente]': 'esDocente()',
  },
  templateUrl: './layout-principal.component.html',
  styleUrl: './layout-principal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPrincipalComponent {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoCerrandoSesion = signal(false);
  private readonly estadoMenuAbierto = signal(false);
  private readonly estadoCuentaAbierta = signal(false);
  private temporizadorCierreCuenta: ReturnType<typeof setTimeout> | null = null;

  readonly usuarioActual = this.autenticacionService.usuarioActual;
  readonly cerrandoSesion = this.estadoCerrandoSesion.asReadonly();
  readonly menuAbierto = this.estadoMenuAbierto.asReadonly();
  readonly cuentaAbierta = this.estadoCuentaAbierta.asReadonly();
  readonly esAdministrador = computed(
    () => this.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly esDocente = computed(
    () => this.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.DOCENTE,
  );
  readonly esGestorLecturaPersonas = computed(() => {
    const codigo = this.usuarioActual?.()?.rol?.codigo;

    return codigo === CODIGOS_ROL.ADMIN || codigo === CODIGOS_ROL.GESTOR_MATRICULA;
  });
  readonly nombreCompletoUsuario = computed(() => {
    const usuario = this.usuarioActual?.() ?? null;

    if (!usuario) {
      return 'Usuario';
    }

    const nombreCompleto = [
      usuario.nombres.trim(),
      usuario.apellidos.trim(),
    ]
      .filter((parteNombre) => parteNombre.length > 0)
      .join(' ');

    return nombreCompleto || 'Usuario';
  });
  readonly nombreRolUsuario = computed(() => {
    const rol = this.usuarioActual?.()?.rol;

    if (!rol) {
      return 'Sin rol asignado';
    }

    const nombreRol = rol.nombre.trim();

    if (nombreRol) {
      return nombreRol;
    }

    return rol.codigo.trim() || 'Sin rol asignado';
  });

  constructor() {
    this.enrutador.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe(() => {
        this.cerrarMenu();
        this.cerrarCuenta();
      });

    this.referenciaDestruccion.onDestroy(() => {
      if (this.temporizadorCierreCuenta !== null) {
        window.clearTimeout(this.temporizadorCierreCuenta);
      }
    });
  }

  alternarMenu(): void {
    this.estadoMenuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.estadoMenuAbierto.set(false);
  }

  abrirCuenta(): void {
    if (this.temporizadorCierreCuenta !== null) {
      window.clearTimeout(this.temporizadorCierreCuenta);
      this.temporizadorCierreCuenta = null;
    }

    this.estadoCuentaAbierta.set(true);
  }

  cerrarCuenta(): void {
    if (this.temporizadorCierreCuenta !== null) {
      window.clearTimeout(this.temporizadorCierreCuenta);
      this.temporizadorCierreCuenta = null;
    }

    this.estadoCuentaAbierta.set(false);
  }

  programarCierreCuenta(): void {
    if (this.temporizadorCierreCuenta !== null) {
      window.clearTimeout(this.temporizadorCierreCuenta);
    }

    this.temporizadorCierreCuenta = window.setTimeout(() => {
      this.estadoCuentaAbierta.set(false);
      this.temporizadorCierreCuenta = null;
    }, 180);
  }

  @HostListener('document:click', ['$event'])
  manejarClicFuera(evento: Event): void {
    const elementoClic = evento.target as Element | null;

    if (this.menuAbierto() && !elementoClic?.closest('nav.menu-principal, .boton-menu')) {
      this.estadoMenuAbierto.set(false);
    }

    if (this.cuentaAbierta() && !elementoClic?.closest('.grupo-cuenta, .boton-cerrar-sesion')) {
      this.estadoCuentaAbierta.set(false);
    }
  }

  @HostListener('window:keydown.escape')
  manejarTeclaEscape(): void {
    this.estadoMenuAbierto.set(false);
    this.estadoCuentaAbierta.set(false);
  }

  cerrarSesion(): void {
    if (this.cerrandoSesion()) {
      return;
    }

    this.estadoCerrandoSesion.set(true);
    this.autenticacionService.cerrarSesion()
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCerrandoSesion.set(false)),
      )
      .subscribe({
        next: () => this.completarCierreSesion(),
        error: () => this.completarCierreSesion(),
      });
  }

  private completarCierreSesion(): void {
    void this.enrutador.navigateByUrl('/iniciar-sesion');
  }

  navegarAlLoginPerfil(perfil: 'estudiante' | 'docente'): void {
    this.estadoCerrandoSesion.set(true);
    this.autenticacionService
      .cerrarSesion()
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCerrandoSesion.set(false)),
      )
      .subscribe({
        next: () => this.navegarALoginConPerfil(perfil),
        error: () => this.navegarALoginConPerfil(perfil),
      });
  }

  private navegarALoginConPerfil(perfil: 'estudiante' | 'docente'): void {
    void this.enrutador.navigate(['/iniciar-sesion'], {
      queryParams: { tipo: perfil },
    });
  }
}
