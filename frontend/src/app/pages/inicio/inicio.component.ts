import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  private readonly autenticacionService = inject(AutenticacionService);

  readonly esAdministrador = computed(
    () => this.autenticacionService.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly esGestorLecturaPersonas = computed(() => {
    const codigo = this.autenticacionService.usuarioActual?.()?.rol?.codigo;

    return codigo === CODIGOS_ROL.ADMIN || codigo === CODIGOS_ROL.GESTOR_MATRICULA;
  });
}