import { Injectable, inject } from '@angular/core';
import { finalize, Observable, shareReplay } from 'rxjs';

import type { RespuestaRenovacionSesion } from '../models/autenticacion.model';
import { AutenticacionService } from './autenticacion.service';

@Injectable({
  providedIn: 'root',
})
export class CoordinadorRenovacionSesionService {
  private readonly autenticacionService = inject(AutenticacionService);
  private renovacionEnCurso: Observable<RespuestaRenovacionSesion> | null = null;

  renovarSesionCompartida(): Observable<RespuestaRenovacionSesion> {
    if (!this.renovacionEnCurso) {
      this.renovacionEnCurso = this.autenticacionService.renovarSesion().pipe(
        finalize(() => {
          this.renovacionEnCurso = null;
        }),
        shareReplay({
          bufferSize: 1,
          refCount: false,
        }),
      );
    }

    return this.renovacionEnCurso;
  }
}
