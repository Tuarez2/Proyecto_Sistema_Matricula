import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { obtenerRutaInicialPorRol } from '../../../core/config/rutas-por-rol';
import type { CredencialesInicioSesion } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

interface PerfilOrientacion {
  codigo: string;
  etiqueta: string;
  icono: string;
}

const PERFILES_ORIENTACION: PerfilOrientacion[] = [
  {
    codigo: 'ADMIN',
    etiqueta: 'Administrativo',
    icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    codigo: 'GESTOR',
    etiqueta: 'Gestor',
    icono: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    codigo: 'ESTUDIANTE',
    etiqueta: 'Estudiante',
    icono: 'M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1.7 3 3.5 6 3.5s6-1.8 6-3.5v-5',
  },
  {
    codigo: 'DOCENTE',
    etiqueta: 'Docente',
    icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM6 19h12M6 15h12',
  },
];

@Component({
  selector: 'app-inicio-sesion',
  imports: [ReactiveFormsModule, LogoComponent],
  templateUrl: './inicio-sesion.component.html',
  styleUrl: './inicio-sesion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioSesionComponent {
  private readonly constructorFormulario = inject(FormBuilder);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly enviandoFormulario = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly contrasenaVisible = signal(false);
  readonly bloqMayusActivo = signal(false);
  readonly perfilSeleccionado = signal<string | null>(null);
  readonly formularioInicioSesion = this.constructorFormulario.nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    contrasena: ['', [Validators.required, Validators.maxLength(128)]],
  });
  readonly perfilesOrientacion = PERFILES_ORIENTACION;

  get controlCorreo() {
    return this.formularioInicioSesion.controls.correo;
  }

  get controlContrasena() {
    return this.formularioInicioSesion.controls.contrasena;
  }

  alternarVisibilidadContrasena(): void {
    this.contrasenaVisible.update((visible) => !visible);
  }

  seleccionarPerfil(codigo: string): void {
    this.perfilSeleccionado.set(
      this.perfilSeleccionado() === codigo ? null : codigo,
    );
  }

  detectarBloqMayus(evento: KeyboardEvent): void {
    this.bloqMayusActivo.set(evento.getModifierState('CapsLock'));
  }

  @HostListener('window:keyup', ['$event'])
  detectarBloqMayusGlobal(evento: KeyboardEvent): void {
    if (evento.key === 'CapsLock') {
      this.bloqMayusActivo.set(evento.getModifierState('CapsLock'));
    }
  }

  enviarFormulario(): void {
    if (this.enviandoFormulario()) {
      return;
    }

    this.mensajeError.set(null);
    this.controlCorreo.setValue(this.controlCorreo.value.trim());

    if (this.formularioInicioSesion.invalid) {
      this.formularioInicioSesion.markAllAsTouched();
      return;
    }

    const datosFormulario = this.formularioInicioSesion.getRawValue();
    const credenciales: CredencialesInicioSesion = {
      correo: datosFormulario.correo.trim(),
      password: datosFormulario.contrasena,
    };

    this.enviandoFormulario.set(true);
    this.autenticacionService
      .iniciarSesion(credenciales)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.enviandoFormulario.set(false);
        }),
      )
      .subscribe({
        next: () => {
          const rutaRetorno = this.obtenerRutaRetornoSegura();
          this.mensajeError.set(null);
          void this.router.navigateByUrl(rutaRetorno);
        },
        error: (error: unknown) => {
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible iniciar sesión.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor. Verifique que el backend esté disponible.';
    }

    if (error.status === 400) {
      return this.obtenerMensajeBackend(error.error) ??
        this.obtenerPrimerDetalle(error.error) ??
        'Revise los datos ingresados.';
    }

    if (error.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }

    if (error.status === 429) {
      const segundosReintento = this.obtenerSegundosReintento(error);

      if (segundosReintento !== null) {
        return `Demasiados intentos. Intente nuevamente en ${segundosReintento} segundos.`;
      }

      return 'Demasiados intentos. Intente nuevamente más tarde.';
    }

    if (error.status >= 500) {
      return 'Ocurrió un error en el servidor. Intente nuevamente más tarde.';
    }

    return 'No fue posible iniciar sesión.';
  }

  private obtenerRutaRetornoSegura(): string {
    const rutaRetorno = this.rutaActiva.snapshot.queryParamMap.get('retorno');

    if (rutaRetorno && this.esRutaRetornoSegura(rutaRetorno)) {
      return rutaRetorno;
    }

    return obtenerRutaInicialPorRol(
      this.autenticacionService.usuarioActual()?.rol?.codigo,
    );
  }

  private esRutaRetornoSegura(ruta: string): boolean {
    return (
      ruta.length > 0 &&
      ruta.startsWith('/') &&
      !ruta.startsWith('//') &&
      ruta !== '/iniciar-sesion' &&
      !ruta.startsWith('/iniciar-sesion?') &&
      !/^[a-z][a-z\d+\-.]*:/i.test(ruta)
    );
  }

  private obtenerMensajeBackend(cuerpoError: unknown): string | null {
    if (!this.esRegistro(cuerpoError)) {
      return null;
    }

    return this.obtenerCadena(cuerpoError['message']);
  }

  private obtenerPrimerDetalle(cuerpoError: unknown): string | null {
    if (!this.esRegistro(cuerpoError) || !Array.isArray(cuerpoError['details'])) {
      return null;
    }

    for (const detalle of cuerpoError['details']) {
      if (this.esRegistro(detalle)) {
        const mensajeDetalle = this.obtenerCadena(detalle['message']);

        if (mensajeDetalle) {
          return mensajeDetalle;
        }
      }
    }

    return null;
  }

  private obtenerSegundosReintento(error: HttpErrorResponse): number | null {
    const valorEncabezado = error.headers.get('Retry-After');

    if (!valorEncabezado) {
      return null;
    }

    const segundos = Number(valorEncabezado);

    if (!Number.isInteger(segundos) || segundos <= 0) {
      return null;
    }

    return segundos;
  }

  private obtenerCadena(valor: unknown): string | null {
    return typeof valor === 'string' && valor.length > 0 ? valor : null;
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null;
  }
}
