import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';

@Component({
  selector: 'app-layout-principal',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout-principal.component.html',
  styleUrl: './layout-principal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPrincipalComponent {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoCerrandoSesion = signal(false);

  readonly usuarioActual = this.autenticacionService.usuarioActual;
  readonly cerrandoSesion = this.estadoCerrandoSesion.asReadonly();
  readonly esAdministrador = computed(
    () => this.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
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
}
