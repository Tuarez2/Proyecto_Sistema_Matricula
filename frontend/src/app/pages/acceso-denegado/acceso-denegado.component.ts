import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { obtenerRutaInicialPorRol } from '../../core/config/rutas-por-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';

@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  templateUrl: './acceso-denegado.component.html',
  styleUrl: './acceso-denegado.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesoDenegadoComponent {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoCerrandoSesion = signal(false);

  readonly rutaInicial = computed(() => {
    const codigoRol = this.autenticacionService.usuarioActual()?.rol?.codigo;

    return obtenerRutaInicialPorRol(codigoRol);
  });
  readonly cerrandoSesion = this.estadoCerrandoSesion.asReadonly();

  cerrarSesion(): void {
    if (this.cerrandoSesion()) {
      return;
    }

    this.estadoCerrandoSesion.set(true);
    this.autenticacionService
      .cerrarSesion()
      .pipe(
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
