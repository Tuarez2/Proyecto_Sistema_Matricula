import { Injectable, signal } from '@angular/core';

import type { ErrorHttpGlobal } from '../models/error-http-global.model';

@Injectable({
  providedIn: 'root',
})
export class ManejadorErroresHttpService {
  private readonly estadoUltimoError = signal<ErrorHttpGlobal | null>(null);

  readonly ultimoError = this.estadoUltimoError.asReadonly();

  registrarError(error: ErrorHttpGlobal): void {
    this.estadoUltimoError.set(error);
  }

  limpiarError(): void {
    this.estadoUltimoError.set(null);
  }
}
