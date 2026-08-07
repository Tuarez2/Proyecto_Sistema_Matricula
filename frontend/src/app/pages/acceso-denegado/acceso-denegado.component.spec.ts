import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import type {
  RespuestaCierreSesion,
  UsuarioAutenticado,
} from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { AccesoDenegadoComponent } from './acceso-denegado.component';

describe('AccesoDenegadoComponent', () => {
  let fixture: ComponentFixture<AccesoDenegadoComponent>;
  let componente: AccesoDenegadoComponent;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let cerrarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaCierreSesion>>>;
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(crearUsuario());
    cerrarSesion = vi.fn(
      () => new Subject<RespuestaCierreSesion>().asObservable(),
    );

    await TestBed.configureTestingModule({
      imports: [AccesoDenegadoComponent],
      providers: [
        provideRouter([]),
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual,
            cerrarSesion,
          },
        },
      ],
    }).compileComponents();

    const enrutador = TestBed.inject(Router);
    navegarPorUrl = vi
      .spyOn(enrutador, 'navigateByUrl')
      .mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(AccesoDenegadoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('muestra el titulo Acceso denegado', () => {
    expect(obtenerTexto()).toContain('Acceso denegado');
  });

  it('ofrece volver al inicio', () => {
    expect(obtenerTexto()).toContain('Volver a su inicio');
  });

  it('el enlace apunta a la raiz para ADMIN', () => {
    usuarioActual.set(crearUsuario());
    fixture.detectChanges();

    expect(obtenerEnlace()?.getAttribute('href')).toBe('/');
  });

  it('el enlace apunta al dashboard para GESTOR_MATRICULA', () => {
    usuarioActual.set(crearUsuarioConRol(CODIGOS_ROL.GESTOR_MATRICULA));
    fixture.detectChanges();

    expect(obtenerEnlace()?.getAttribute('href')).toBe('/dashboard-gestor');
  });

  it('el enlace apunta al portal para ESTUDIANTE', () => {
    usuarioActual.set(crearUsuarioConRol(CODIGOS_ROL.ESTUDIANTE));
    fixture.detectChanges();

    expect(obtenerEnlace()?.getAttribute('href')).toBe('/portal-estudiante');
  });

  it('el enlace apunta a acceso denegado cuando no hay rol', () => {
    usuarioActual.set(crearUsuarioConRol(null));
    fixture.detectChanges();

    expect(obtenerEnlace()?.getAttribute('href')).toBe('/acceso-denegado');
  });

  it('no muestra informacion tecnica', () => {
    expect(obtenerTexto()).not.toContain('stack');
    expect(obtenerTexto()).not.toContain('exception');
  });

  it('existe una opcion para cerrar sesion', () => {
    expect(obtenerTexto()).toContain('Cerrar sesión');
  });

  it('al presionar cerrar sesion llama una vez a cerrarSesion', () => {
    obtenerBotonCerrarSesion()?.click();

    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('al completarse navega a iniciar-sesion', () => {
    const solicitud = prepararCierrePendiente();

    obtenerBotonCerrarSesion()?.click();
    solicitud.next({ success: true, message: 'Cerrado.' });
    solicitud.complete();

    expect(navegarPorUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });

  it('ante error tambien navega a iniciar-sesion', () => {
    cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error de cierre')),
    );

    obtenerBotonCerrarSesion()?.click();

    expect(navegarPorUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });

  function obtenerEnlace(): HTMLAnchorElement | null {
    return fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;
  }

  function obtenerBotonCerrarSesion(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      'button.btn-link',
    ) as HTMLButtonElement | null;
  }

  function obtenerTexto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function prepararCierrePendiente(): Subject<RespuestaCierreSesion> {
    const solicitud = new Subject<RespuestaCierreSesion>();

    cerrarSesion.mockReturnValueOnce(solicitud.asObservable());

    return solicitud;
  }
});

function crearUsuario(
  usuarioParcial: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'ACTIVO',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
    ...usuarioParcial,
  };
}

function crearUsuarioConRol(codigoRol: string | null): UsuarioAutenticado {
  return crearUsuario({
    rol: codigoRol
      ? {
          id: 1,
          codigo: codigoRol,
          nombre: codigoRol,
        }
      : null,
  });
}
