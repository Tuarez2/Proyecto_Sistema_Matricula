import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import type {
  DatosAutenticacion,
  RolAutenticado,
  TokensSesion,
  UsuarioAutenticado,
} from '../models/autenticacion.model';

const CLAVE_SESION = 'sistema_matricula_sesion';

@Injectable({
  providedIn: 'root',
})
export class AlmacenamientoSesionService {
  private readonly plataformaId = inject(PLATFORM_ID);

  guardarSesion(datosSesion: DatosAutenticacion): void {
    const almacenamiento = this.obtenerAlmacenamiento();

    if (!almacenamiento) {
      return;
    }

    almacenamiento.setItem(CLAVE_SESION, JSON.stringify(datosSesion));
  }

  obtenerSesion(): DatosAutenticacion | null {
    const almacenamiento = this.obtenerAlmacenamiento();

    if (!almacenamiento) {
      return null;
    }

    const valorSesion = almacenamiento.getItem(CLAVE_SESION);

    if (valorSesion === null) {
      return null;
    }

    try {
      const datosSesion: unknown = JSON.parse(valorSesion);

      if (!this.esDatosAutenticacion(datosSesion)) {
        almacenamiento.removeItem(CLAVE_SESION);
        return null;
      }

      return datosSesion;
    } catch {
      almacenamiento.removeItem(CLAVE_SESION);
      return null;
    }
  }

  obtenerTokenAcceso(): string | null {
    return this.obtenerSesion()?.tokens.accessToken ?? null;
  }

  obtenerTokenRenovacion(): string | null {
    return this.obtenerSesion()?.tokens.refreshToken ?? null;
  }

  eliminarSesion(): void {
    const almacenamiento = this.obtenerAlmacenamiento();

    if (!almacenamiento) {
      return;
    }

    almacenamiento.removeItem(CLAVE_SESION);
  }

  private obtenerAlmacenamiento(): Storage | null {
    if (!isPlatformBrowser(this.plataformaId) || typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage;
  }

  private esDatosAutenticacion(valor: unknown): valor is DatosAutenticacion {
    if (!this.esRegistro(valor)) {
      return false;
    }

    return (
      this.esUsuarioAutenticado(valor['user']) &&
      this.esTokensSesion(valor['tokens'])
    );
  }

  private esUsuarioAutenticado(valor: unknown): valor is UsuarioAutenticado {
    if (!this.esRegistro(valor)) {
      return false;
    }

    return (
      this.esNumero(valor['id']) &&
      this.esTexto(valor['nombres']) &&
      this.esTexto(valor['apellidos']) &&
      this.esTexto(valor['correo']) &&
      this.esTexto(valor['estado']) &&
      typeof valor['debe_cambiar_password'] === 'boolean' &&
      (valor['rol'] === null || this.esRolAutenticado(valor['rol']))
    );
  }

  private esRolAutenticado(valor: unknown): valor is RolAutenticado {
    if (!this.esRegistro(valor)) {
      return false;
    }

    return (
      this.esNumero(valor['id']) &&
      this.esTexto(valor['codigo']) &&
      this.esTexto(valor['nombre'])
    );
  }

  private esTokensSesion(valor: unknown): valor is TokensSesion {
    if (!this.esRegistro(valor)) {
      return false;
    }

    return (
      this.esTexto(valor['accessToken']) &&
      this.esTexto(valor['refreshToken']) &&
      this.esTexto(valor['accessTokenExpiresAt']) &&
      this.esTexto(valor['refreshTokenExpiresAt'])
    );
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null;
  }

  private esNumero(valor: unknown): valor is number {
    return typeof valor === 'number' && Number.isFinite(valor);
  }

  private esTexto(valor: unknown): valor is string {
    return typeof valor === 'string' && valor.length > 0;
  }
}
