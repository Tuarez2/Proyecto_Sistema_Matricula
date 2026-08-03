import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import type { CredencialesInicioSesion } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';

@Component({
  selector: 'app-inicio-sesion',
  imports: [ReactiveFormsModule],
  templateUrl: './inicio-sesion.component.html',
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
  readonly formularioInicioSesion = this.constructorFormulario.nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    contrasena: ['', [Validators.required, Validators.maxLength(128)]],
  });

  get controlCorreo() {
    return this.formularioInicioSesion.controls.correo;
  }

  get controlContrasena() {
    return this.formularioInicioSesion.controls.contrasena;
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

    return '/';
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
