import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ESTADOS_ACADEMICOS_ESTUDIANTE,
  type CarreraEstudiante,
  type Estudiante,
  type SolicitudCrearEstudiante,
} from '../../models/estudiante.model';
import { EstudianteFormComponent } from './estudiante-form.component';

describe('EstudianteFormComponent', () => {
  let fixture: ComponentFixture<EstudianteFormComponent>;
  let componente: EstudianteFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudianteFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EstudianteFormComponent);
    componente = fixture.componentInstance;
    componente.carreras = [crearCarrera()];
    fixture.detectChanges();
  });

  it('no emite cuando el formulario es invalido', () => {
    const guardar = vi.spyOn(componente.guardarEstudiante, 'emit');

    componente.enviarFormulario();

    expect(guardar).not.toHaveBeenCalled();
    expect(componente.formularioEstudiante.touched).toBe(true);
  });

  it('emite el payload real del backend cuando el formulario es valido', () => {
    const guardar = vi.spyOn(componente.guardarEstudiante, 'emit');

    completarFormularioValido();
    componente.enviarFormulario();

    expect(guardar).toHaveBeenCalledWith(crearSolicitudFormulario());
  });

  it('convierte telefono vacio a null', () => {
    const guardar = vi.spyOn(componente.guardarEstudiante, 'emit');

    completarFormularioValido({ telefono: '' });
    componente.enviarFormulario();

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: null }),
    );
  });

  it('puebla el formulario con el estudiante inicial', () => {
    componente.estudianteInicial = crearEstudiante();
    componente.ngOnChanges({
      estudianteInicial: {
        currentValue: componente.estudianteInicial,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(componente.formularioEstudiante.controls.numeroMatricula.value).toBe(
      'EST-2026-001',
    );
    expect(componente.formularioEstudiante.controls.carreraId.value).toBe('2');
  });

  it('no emite dos veces si esta enviando', () => {
    const guardar = vi.spyOn(componente.guardarEstudiante, 'emit');

    completarFormularioValido();
    componente.enviando = true;
    componente.enviarFormulario();

    expect(guardar).not.toHaveBeenCalled();
  });

  function completarFormularioValido(
    cambios: Partial<SolicitudFormulario> = {},
  ): void {
    componente.formularioEstudiante.setValue({
      carreraId: '2',
      numeroMatricula: ' EST-2026-001 ',
      identificacion: '1002003004',
      nombres: ' Ana ',
      apellidos: ' Vera ',
      correo: 'ana.vera@universidad.edu',
      telefono: '0999999999',
      fechaNacimiento: '2001-03-12',
      estadoAcademico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
      nivelAcademicoActual: '3',
      ...cambios,
    });
  }
});

interface SolicitudFormulario {
  carreraId: string;
  numeroMatricula: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  estadoAcademico: (typeof ESTADOS_ACADEMICOS_ESTUDIANTE)[keyof typeof ESTADOS_ACADEMICOS_ESTUDIANTE];
  nivelAcademicoActual: string;
}

function crearCarrera(): CarreraEstudiante {
  return {
    id: 2,
    codigo: 'SIS',
    nombre: 'Ingeniería de Software',
    duracion_semestres: 8,
    facultad_id: 1,
    activo: true,
  };
}

function crearEstudiante(): Estudiante {
  return {
    id: 15,
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
    carrera: crearCarrera(),
  };
}

function crearSolicitudFormulario(): SolicitudCrearEstudiante {
  return {
    carrera_id: 2,
    numero_matricula: 'EST-2026-001',
    identificacion: '1002003004',
    nombres: 'Ana',
    apellidos: 'Vera',
    correo: 'ana.vera@universidad.edu',
    telefono: '0999999999',
    fecha_nacimiento: '2001-03-12',
    estado_academico: ESTADOS_ACADEMICOS_ESTUDIANTE.ACTIVO,
    nivel_academico_actual: 3,
  };
}
