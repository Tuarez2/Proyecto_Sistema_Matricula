import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { AccesoDenegadoComponent } from './acceso-denegado.component';

describe('AccesoDenegadoComponent', () => {
  let fixture: ComponentFixture<AccesoDenegadoComponent>;
  let componente: AccesoDenegadoComponent;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(crearUsuario());

    await TestBed.configureTestingModule({
      imports: [AccesoDenegadoComponent],
      providers: [
        provideRouter([]),
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual,
          },
        },
      ],
    }).compileComponents();

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

  function obtenerEnlace(): HTMLAnchorElement | null {
    return fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;
  }

  function obtenerTexto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
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
