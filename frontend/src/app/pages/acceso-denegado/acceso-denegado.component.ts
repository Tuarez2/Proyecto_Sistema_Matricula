import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

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

  readonly rutaInicial = computed(() => {
    const codigoRol = this.autenticacionService.usuarioActual()?.rol?.codigo;

    return obtenerRutaInicialPorRol(codigoRol);
  });
}
