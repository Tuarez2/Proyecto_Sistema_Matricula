import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import type { UsuarioAutenticado } from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  let fixture: ComponentFixture<InicioComponent>;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(
      crearUsuario('Persona', 'Prueba', 'Docente', CODIGOS_ROL.DOCENTE),
    );

    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [
        provideRouter([]),
        {
          provide: AutenticacionService,
          useValue: {
            usuarioActual: usuarioActual.asReadonly(),
          },
        },
      ],
    }).compileComponents();
  });

  it('saluda al usuario por su nombre completo', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Bienvenido, Persona Prueba');
  });

  it('muestra el rol actual del usuario', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Docente');
  });

  it('muestra la fecha de hoy en formato humano', () => {
    crearComponente();

    expect(obtenerTexto()).toContain(formatearFechaHoy(new Date()));
  });

  it('oculta el rol cuando el usuario no tiene rol', () => {
    usuarioActual.set(crearUsuario('', ''));

    crearComponente();

    expect(obtenerTexto()).not.toMatch(/\bDocente\b/);
  });

  it('muestra el módulo de usuarios solo al administrador', () => {
    usuarioActual.set(crearUsuario('Admin', 'Sistema', null, CODIGOS_ROL.ADMIN));

    crearComponente();

    expect(obtenerTexto()).toContain('Usuarios');
  });

  it('no muestra el módulo de usuarios a rol distinto de administrador', () => {
    crearComponente();

    expect(obtenerTexto()).not.toContain('Usuarios');
  });

  it('oculta módulos restringidos al docente', () => {
    crearComponente();

    expect(obtenerTexto()).toContain('Asignaturas');
    expect(obtenerTexto()).toContain('Carreras');
    expect(obtenerTexto()).not.toContain('Matrículas');
    expect(obtenerTexto()).not.toContain('Estudiantes');
  });

  it('muestra el catálogo completo de módulos al administrador', () => {
    usuarioActual.set(crearUsuario('Admin', 'Sistema', 'Administrador', CODIGOS_ROL.ADMIN));

    crearComponente();

    expect(obtenerTexto()).toContain('Usuarios');
    expect(obtenerTexto()).toContain('Matrículas');
    expect(obtenerTexto()).toContain('Estudiantes');
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function formatearFechaHoy(valor: Date): string {
  const dia = String(valor.getDate()).padStart(2, '0');
  const mes = valor.toLocaleDateString('es-ES', { month: 'short' });
  const anio = valor.getFullYear();

  return `${dia} ${mes.replace('.', '')} ${anio}`;
}

function crearUsuario(
  nombres: string,
  apellidos: string,
  nombreRol: string | null = 'Docente',
  codigoRol: string = 'docente',
): UsuarioAutenticado {
  return {
    id: 1,
    nombres,
    apellidos,
    correo: 'persona.prueba@universidad.edu',
    estado: 'activo',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: nombreRol ?? codigoRol,
    },
  };
}
